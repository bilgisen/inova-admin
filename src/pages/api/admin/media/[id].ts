import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { mediaUpdateSchema } from '../../../../lib/validation';
import { cloudinary } from '../../../../lib/cloudinary';

export const GET: APIRoute = async ({ params }) => {
  const db = await getDb();
  const id = Number(params.id);

  const result = await db.execute('SELECT * FROM media WHERE id = ?', [id]);
  if (!result.rows.length) {
    return new Response(JSON.stringify({ error: 'Media not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(result.rows[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const db = await getDb();
    const id = Number(params.id);
    const body = await request.json();
    const parsed = mediaUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await db.execute('SELECT * FROM media WHERE id = ?', [id]);
    if (!existing.rows.length) {
      return new Response(JSON.stringify({ error: 'Media not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = parsed.data;
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.project_id !== undefined) { fields.push('project_id = ?'); values.push(data.project_id); }
    if (data.filename) { fields.push('filename = ?'); values.push(data.filename); }
    if (data.original_name) { fields.push('original_name = ?'); values.push(data.original_name); }
    if (data.url) { fields.push('url = ?'); values.push(data.url); }
    if (data.cloudinary_pid) { fields.push('cloudinary_pid = ?'); values.push(data.cloudinary_pid); }
    if (data.width) { fields.push('width = ?'); values.push(data.width); }
    if (data.height) { fields.push('height = ?'); values.push(data.height); }
    if (data.alt_text) { fields.push('alt_text = ?'); values.push(JSON.stringify(data.alt_text)); }
    if (data.caption) { fields.push('caption = ?'); values.push(JSON.stringify(data.caption)); }
    if (data.is_cover !== undefined) {
      if (data.is_cover) {
        const media = existing.rows[0] as { project_id: number | null };
        if (media.project_id) {
          await db.execute('UPDATE media SET is_cover = 0 WHERE project_id = ?', [media.project_id]);
        }
      }
      fields.push('is_cover = ?');
      values.push(data.is_cover);
    }
    if (data.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(data.sort_order); }

    if (!fields.length) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    values.push(id);
    await db.execute(`UPDATE media SET ${fields.join(', ')} WHERE id = ?`, values);

    const updated = await db.execute('SELECT * FROM media WHERE id = ?', [id]);
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

  const existing = await db.execute('SELECT * FROM media WHERE id = ?', [id]);
  if (!existing.rows.length) {
    return new Response(JSON.stringify({ error: 'Media not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const media = existing.rows[0] as { cloudinary_pid: string; project_id: number | null; is_cover: number };

  try {
    await cloudinary.uploader.destroy(media.cloudinary_pid);
  } catch {
    // Cloudinary hatasını geç, DB'den silmeye devam et
  }

  if (media.is_cover && media.project_id) {
    const nextCover = await db.execute(
      'SELECT id FROM media WHERE project_id = ? AND id != ? ORDER BY sort_order ASC LIMIT 1',
      [media.project_id, id]
    );
    if (nextCover.rows.length) {
      await db.execute('UPDATE media SET is_cover = 1 WHERE id = ?', [nextCover.rows[0].id]);
    }
  }

  await db.execute('DELETE FROM media WHERE id = ?', [id]);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
