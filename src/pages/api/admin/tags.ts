import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { tagSchema } from '../../../lib/validation';

export const GET: APIRoute = async () => {
  const db = getDb();
  const result = await db.execute(
    'SELECT t.*, COUNT(pt.project_id) as project_count FROM tags t LEFT JOIN project_tags pt ON t.id = pt.tag_id GROUP BY t.id ORDER BY t.name ASC'
  );
  return new Response(JSON.stringify(result.rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = tagSchema.safeParse(body);

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
      'INSERT INTO tags (name, slug) VALUES (?, ?)',
      [JSON.stringify(data.name), data.slug]
    );

    const tag = await db.execute('SELECT * FROM tags WHERE id = ?', [Number(result.lastInsertRowid)]);

    return new Response(JSON.stringify(tag.rows[0]), {
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
