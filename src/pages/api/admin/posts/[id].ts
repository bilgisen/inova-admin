import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { postUpdateSchema } from '../../../../lib/validation';

export const GET: APIRoute = async ({ params }) => {
  const db = await getDb();
  const id = Number(params.id);

  const result = await db.execute(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM posts p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? AND p.deleted_at IS NULL`, [id]
  );
  if (!result.rows.length) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }

  const tags = await db.execute(
    `SELECT t.* FROM tags t JOIN post_tags pt ON t.id = pt.tag_id WHERE pt.post_id = ?`, [id]
  );

  return new Response(JSON.stringify({ ...result.rows[0], tags: tags.rows }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const db = await getDb();
    const id = Number(params.id);
    const body = await request.json();
    const parsed = postUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await db.execute('SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing.rows.length) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = parsed.data;
    const { tags, ...postData } = data;
    const fields: string[] = [];
    const values: unknown[] = [];

    const fieldMap: Record<string, unknown> = {
      title: postData.title ? JSON.stringify(postData.title) : undefined,
      slug: postData.slug,
      content: postData.content ? JSON.stringify(postData.content) : undefined,
      excerpt: postData.excerpt ? JSON.stringify(postData.excerpt) : undefined,
      category_id: postData.category_id,
      status: postData.status,
      meta_title: postData.meta_title ? JSON.stringify(postData.meta_title) : undefined,
      meta_description: postData.meta_description ? JSON.stringify(postData.meta_description) : undefined,
      og_image: postData.og_image,
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) { fields.push(`${key} = ?`); values.push(value); }
    }

    if (postData.status === 'published') {
      fields.push('published_at = COALESCE(published_at, ?)');
      values.push(new Date().toISOString());
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await db.execute(`UPDATE posts SET ${fields.join(', ')} WHERE id = ?`, values);

    if (tags) {
      await db.execute('DELETE FROM post_tags WHERE post_id = ?', [id]);
      if (tags.length) {
        await db.batch(tags.map(tagId => ({
          sql: 'INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)',
          args: [id, tagId],
        })));
      }
    }

    const updated = await db.execute('SELECT * FROM posts WHERE id = ?', [id]);
    return new Response(JSON.stringify(updated.rows[0]), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = await getDb();
  const id = Number(params.id);
  const existing = await db.execute('SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!existing.rows.length) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }
  await db.execute('UPDATE posts SET deleted_at = ?, updated_at = ? WHERE id = ?', [
    new Date().toISOString(), new Date().toISOString(), id,
  ]);
  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
