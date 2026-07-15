import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { projectSchema } from '../../../lib/validation';

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;
  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');
  const featured = url.searchParams.get('featured');

  let where = "WHERE p.deleted_at IS NULL";
  const params: unknown[] = [];

  if (category) {
    where += " AND p.category_id = ?";
    params.push(Number(category));
  }
  if (status) {
    where += " AND p.status = ?";
    params.push(status);
  }
  if (featured === '1') {
    where += " AND p.is_featured = 1";
  }
  if (search) {
    where += " AND (p.title LIKE ? OR p.slug LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  const [countResult, rowsResult] = await Promise.all([
    db.execute(`SELECT COUNT(*) as total FROM projects p ${where}`, params),
    db.execute(`
      SELECT p.*, c.name as category_name, c.slug as category_slug,
        (SELECT m.url FROM media m WHERE m.project_id = p.id AND m.is_cover = 1 LIMIT 1) as cover_image,
        (SELECT COUNT(*) FROM media m WHERE m.project_id = p.id) as media_count
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY p.sort_order ASC, p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]),
  ]);

  const total = Number(countResult.rows[0]?.total || 0);

  return new Response(JSON.stringify({
    data: rowsResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = projectSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDb();
    const data = parsed.data;

    const result = await db.execute(
      `INSERT INTO projects (title, slug, description, content, client, fair_name, fair_date, location, category_id, status, sort_order, is_featured, meta_title, meta_description, og_image, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        JSON.stringify(data.title),
        data.slug,
        JSON.stringify(data.description || {}),
        JSON.stringify(data.content || {}),
        JSON.stringify(data.client || {}),
        JSON.stringify(data.fair_name || {}),
        data.fair_date || null,
        JSON.stringify(data.location || {}),
        data.category_id || null,
        data.status || 'draft',
        data.sort_order || 0,
        data.is_featured || 0,
        JSON.stringify(data.meta_title || {}),
        JSON.stringify(data.meta_description || {}),
        data.og_image || null,
        data.status === 'published' ? new Date().toISOString() : null,
      ]
    );

    const project = await db.execute(
      'SELECT * FROM projects WHERE id = ?',
      [Number(result.lastInsertRowid)]
    );

    return new Response(JSON.stringify(project.rows[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
