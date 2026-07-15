import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { postSchema } from '../../../lib/validation';

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  const offset = (page - 1) * limit;
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');

  let where = "WHERE p.deleted_at IS NULL";
  const params: unknown[] = [];
  if (status) { where += " AND p.status = ?"; params.push(status); }
  if (category) { where += " AND p.category_id = ?"; params.push(Number(category)); }

  const [countResult, rowsResult] = await Promise.all([
    db.execute(`SELECT COUNT(*) as total FROM posts p ${where}`, params),
    db.execute(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM posts p
      LEFT JOIN categories c ON p.category_id = c.id
      ${where}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]),
  ]);

  return new Response(JSON.stringify({
    data: rowsResult.rows,
    total: Number(countResult.rows[0]?.total || 0),
    page, limit,
    totalPages: Math.ceil(Number(countResult.rows[0]?.total || 0) / limit),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDb();
    const data = parsed.data;
    const { tags, ...postData } = data;

    const result = await db.execute(
      `INSERT INTO posts (title, slug, content, excerpt, category_id, status, meta_title, meta_description, og_image, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        JSON.stringify(postData.title), postData.slug,
        JSON.stringify(postData.content || {}), JSON.stringify(postData.excerpt || {}),
        postData.category_id || null, postData.status || 'draft',
        JSON.stringify(postData.meta_title || {}), JSON.stringify(postData.meta_description || {}),
        postData.og_image || null,
        postData.status === 'published' ? new Date().toISOString() : null,
      ]
    );

    const postId = Number(result.lastInsertRowid);

    if (tags?.length) {
      await db.batch(tags.map(tagId => ({
        sql: 'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
        args: [postId, tagId],
      })));
    }

    const post = await db.execute('SELECT * FROM posts WHERE id = ?', [postId]);
    return new Response(JSON.stringify(post.rows[0]), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
};
