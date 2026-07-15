import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10));
  const offset = (page - 1) * limit;

  const [countResult, rowsResult] = await Promise.all([
    db.execute("SELECT COUNT(*) as total FROM posts WHERE deleted_at IS NULL AND status = 'published'"),
    db.execute(
      `SELECT id, title, slug, excerpt, published_at, og_image,
              (SELECT c.name FROM categories c WHERE c.id = posts.category_id) as category_name
       FROM posts
       WHERE deleted_at IS NULL AND status = 'published'
       ORDER BY published_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    ),
  ]);

  const total = Number(countResult.rows[0]?.total || 0);

  return new Response(JSON.stringify({
    data: rowsResult.rows,
    total, page, limit,
    totalPages: Math.ceil(total / limit),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
