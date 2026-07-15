import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';

export const GET: APIRoute = async () => {
  const db = getDb();

  const [projectsResult, mediaResult, postsResult, pagesResult, recentResult, categoryResult] =
    await Promise.all([
      db.execute("SELECT COUNT(*) as count FROM projects WHERE deleted_at IS NULL"),
      db.execute("SELECT COUNT(*) as count FROM media"),
      db.execute("SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL"),
      db.execute("SELECT COUNT(*) as count FROM pages WHERE deleted_at IS NULL"),
      db.execute("SELECT id, title, slug, status, created_at FROM projects WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 5"),
      db.execute("SELECT c.name, COUNT(p.id) as count FROM categories c LEFT JOIN projects p ON c.id = p.category_id AND p.deleted_at IS NULL WHERE c.type = 'project' GROUP BY c.id"),
    ]);

  return new Response(JSON.stringify({
    stats: {
      projects: Number(projectsResult.rows[0]?.count || 0),
      media: Number(mediaResult.rows[0]?.count || 0),
      posts: Number(postsResult.rows[0]?.count || 0),
      pages: Number(pagesResult.rows[0]?.count || 0),
    },
    recentProjects: recentResult.rows,
    categoryBreakdown: categoryResult.rows,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
