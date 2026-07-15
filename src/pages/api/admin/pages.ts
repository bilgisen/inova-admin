import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { pageSchema } from '../../../lib/validation';

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status');

  let where = "WHERE deleted_at IS NULL";
  const params: unknown[] = [];
  if (status) { where += " AND status = ?"; params.push(status); }

  const [countResult, rowsResult] = await Promise.all([
    db.execute(`SELECT COUNT(*) as total FROM pages ${where}`, params),
    db.execute(`SELECT * FROM pages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]),
  ]);

  return new Response(JSON.stringify({
    data: rowsResult.rows,
    total: Number(countResult.rows[0]?.total || 0), page, limit,
    totalPages: Math.ceil(Number(countResult.rows[0]?.total || 0) / limit),
  }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = pageSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDb();
    const data = parsed.data;
    const result = await db.execute(
      `INSERT INTO pages (title, slug, content, status, meta_title, meta_description, og_image, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        JSON.stringify(data.title), data.slug, JSON.stringify(data.content || {}),
        data.status || 'draft', JSON.stringify(data.meta_title || {}),
        JSON.stringify(data.meta_description || {}), data.og_image || null,
        data.status === 'published' ? new Date().toISOString() : null,
      ]
    );
    const page = await db.execute('SELECT * FROM pages WHERE id = ?', [Number(result.lastInsertRowid)]);
    return new Response(JSON.stringify(page.rows[0]), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
};
