import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const lang = url.searchParams.get('lang') || 'en';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 12));
  const offset = (page - 1) * limit;
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured');

  let where = "WHERE p.deleted_at IS NULL AND p.status = 'published'";
  const params: unknown[] = [];

  if (category) { where += " AND c.slug = ?"; params.push(category); }
  if (featured === '1') { where += " AND p.is_featured = 1"; }

  const [countResult, rowsResult] = await Promise.all([
    db.execute(`SELECT COUNT(*) as total FROM projects p LEFT JOIN categories c ON p.category_id = c.id ${where}`, params),
    db.execute(
      `SELECT p.id, p.title, p.slug, p.description, p.client, p.fair_name, p.fair_date, p.location,
              p.category_id, p.is_featured, p.published_at,
              c.name as category_name, c.slug as category_slug,
              (SELECT m.url FROM media m WHERE m.project_id = p.id AND m.is_cover = 1 LIMIT 1) as cover_image,
              (SELECT json_group_array(json_object('id', m.id, 'url', m.url, 'alt_text', m.alt_text, 'width', m.width, 'height', m.height))
               FROM (SELECT * FROM media WHERE project_id = p.id ORDER BY sort_order ASC) m) as media
       FROM projects p
       LEFT JOIN categories c ON p.category_id = c.id
       ${where}
       ORDER BY p.sort_order ASC, p.published_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ),
  ]);

  const total = Number(countResult.rows[0]?.total || 0);

  return new Response(JSON.stringify({
    data: rowsResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    lang,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
