import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { pageUpdateSchema } from '../../../../lib/validation';

export const GET: APIRoute = async ({ params }) => {
  const db = getDb();
  const id = Number(params.id);
  const result = await db.execute('SELECT * FROM pages WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!result.rows.length) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(result.rows[0]), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const db = getDb();
    const id = Number(params.id);
    const body = await request.json();
    const parsed = pageUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten() }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await db.execute('SELECT id FROM pages WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!existing.rows.length) {
      return new Response(JSON.stringify({ error: 'Page not found' }), {
        status: 404, headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = parsed.data;
    const fields: string[] = [];
    const values: unknown[] = [];
    const fieldMap: Record<string, unknown> = {
      title: data.title ? JSON.stringify(data.title) : undefined,
      slug: data.slug, content: data.content ? JSON.stringify(data.content) : undefined,
      status: data.status,
      meta_title: data.meta_title ? JSON.stringify(data.meta_title) : undefined,
      meta_description: data.meta_description ? JSON.stringify(data.meta_description) : undefined,
      og_image: data.og_image,
    };

    for (const [key, value] of Object.entries(fieldMap)) {
      if (value !== undefined) { fields.push(`${key} = ?`); values.push(value); }
    }

    if (data.status === 'published') {
      fields.push('published_at = COALESCE(published_at, ?)');
      values.push(new Date().toISOString());
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await db.execute(`UPDATE pages SET ${fields.join(', ')} WHERE id = ?`, values);
    const updated = await db.execute('SELECT * FROM pages WHERE id = ?', [id]);
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
  const db = getDb();
  const id = Number(params.id);
  const existing = await db.execute('SELECT id FROM pages WHERE id = ? AND deleted_at IS NULL', [id]);
  if (!existing.rows.length) {
    return new Response(JSON.stringify({ error: 'Page not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' },
    });
  }
  await db.execute('UPDATE pages SET deleted_at = ?, updated_at = ? WHERE id = ?', [
    new Date().toISOString(), new Date().toISOString(), id,
  ]);
  return new Response(JSON.stringify({ success: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
};
