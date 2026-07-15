import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { tagUpdateSchema } from '../../../../lib/validation';

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const db = await getDb();
    const id = Number(params.id);
    const body = await request.json();
    const parsed = tagUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await db.execute('SELECT id FROM tags WHERE id = ?', [id]);
    if (!existing.rows.length) {
      return new Response(JSON.stringify({ error: 'Tag not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = parsed.data;
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name) { fields.push('name = ?'); values.push(JSON.stringify(data.name)); }
    if (data.slug) { fields.push('slug = ?'); values.push(data.slug); }

    if (!fields.length) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    values.push(id);
    await db.execute(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = await db.execute('SELECT * FROM tags WHERE id = ?', [id]);
    return new Response(JSON.stringify(updated.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = await getDb();
  const id = Number(params.id);

  const existing = await db.execute('SELECT id FROM tags WHERE id = ?', [id]);
  if (!existing.rows.length) {
    return new Response(JSON.stringify({ error: 'Tag not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.execute('DELETE FROM project_tags WHERE tag_id = ?', [id]);
  await db.execute('DELETE FROM tags WHERE id = ?', [id]);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
