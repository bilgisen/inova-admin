import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  const db = await getDb();
  const result = await db.execute(
    "SELECT id, title, slug, content, meta_title, meta_description, updated_at FROM pages WHERE slug = ? AND deleted_at IS NULL AND status = 'published'",
    [params.slug]
  );

  if (!result.rows.length) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(result.rows[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
