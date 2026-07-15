import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  const db = await getDb();
  const result = await db.execute(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM posts p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.slug = ? AND p.deleted_at IS NULL AND p.status = 'published'`,
    [params.slug]
  );

  if (!result.rows.length) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(result.rows[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
