import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';

export const GET: APIRoute = async ({ params }) => {
  const db = await getDb();
  const slug = params.slug;

  const result = await db.execute(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM projects p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.slug = ? AND p.deleted_at IS NULL AND p.status = 'published'`,
    [slug]
  );

  if (!result.rows.length) {
    return new Response(JSON.stringify({ error: 'Project not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const media = await db.execute(
    'SELECT id, url, alt_text, caption, width, height, is_cover, sort_order FROM media WHERE project_id = ? ORDER BY sort_order ASC',
    [result.rows[0].id]
  );

  const tags = await db.execute(
    `SELECT t.id, t.name, t.slug FROM tags t
     JOIN project_tags pt ON t.id = pt.tag_id
     WHERE pt.project_id = ?`,
    [result.rows[0].id]
  );

  const related = await db.execute(
    `SELECT p.id, p.title, p.slug, p.fair_date,
            (SELECT m.url FROM media m WHERE m.project_id = p.id AND m.is_cover = 1 LIMIT 1) as cover_image
     FROM projects p
     WHERE p.category_id = ? AND p.id != ? AND p.deleted_at IS NULL AND p.status = 'published'
     LIMIT 4`,
    [result.rows[0].category_id, result.rows[0].id]
  );

  return new Response(JSON.stringify({
    ...result.rows[0],
    media: media.rows,
    tags: tags.rows,
    related: related.rows,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
