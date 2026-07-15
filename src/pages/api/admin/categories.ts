import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { categorySchema } from '../../../lib/validation';

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  let sql = 'SELECT * FROM categories';
  const params: unknown[] = [];

  if (type) {
    sql += ' WHERE type = ?';
    params.push(type);
  }
  sql += ' ORDER BY sort_order ASC, name ASC';

  const result = await db.execute(sql, params);
  return new Response(JSON.stringify(result.rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);

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
      `INSERT INTO categories (name, slug, type, description, sort_order) VALUES (?, ?, ?, ?, ?)`,
      [
        JSON.stringify(data.name),
        data.slug,
        data.type,
        JSON.stringify(data.description || {}),
        data.sort_order || 0,
      ]
    );

    const category = await db.execute(
      'SELECT * FROM categories WHERE id = ?',
      [Number(result.lastInsertRowid)]
    );

    return new Response(JSON.stringify(category.rows[0]), {
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
