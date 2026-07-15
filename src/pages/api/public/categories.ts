import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = async () => {
  const db = await getDb();

  const result = await db.execute(
    `SELECT c.id, c.name, c.slug, c.description,
            COUNT(p.id) as project_count
     FROM categories c
     LEFT JOIN projects p ON c.id = p.category_id AND p.deleted_at IS NULL AND p.status = 'published'
     WHERE c.type = 'project'
     GROUP BY c.id
     ORDER BY c.sort_order ASC, c.name ASC`
  );

  return new Response(JSON.stringify(result.rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
