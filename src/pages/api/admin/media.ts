import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { mediaSchema } from '../../../lib/validation';
import { generateSignature, getUploadParams } from '../../../lib/cloudinary';

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
  const offset = (page - 1) * limit;
  const projectId = url.searchParams.get('project_id');

  let where = '';
  const params: unknown[] = [];
  if (projectId) {
    where = 'WHERE project_id = ?';
    params.push(Number(projectId));
  }

  const [countResult, rowsResult] = await Promise.all([
    db.execute(`SELECT COUNT(*) as total FROM media ${where}`, params),
    db.execute(
      `SELECT * FROM media ${where} ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ),
  ]);

  return new Response(JSON.stringify({
    data: rowsResult.rows,
    total: Number(countResult.rows[0]?.total || 0),
    page,
    limit,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = mediaSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = getDb();
    const data = parsed.data;

    if (data.is_cover) {
      await db.execute(
        'UPDATE media SET is_cover = 0 WHERE project_id = ?',
        [data.project_id]
      );
    }

    const result = await db.execute(
      `INSERT INTO media (project_id, filename, original_name, mime_type, url, cloudinary_pid, width, height, file_size, alt_text, caption, is_cover, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.project_id || null,
        data.filename,
        data.original_name,
        data.mime_type || 'image/jpeg',
        data.url,
        data.cloudinary_pid,
        data.width || null,
        data.height || null,
        data.file_size || null,
        JSON.stringify(data.alt_text || {}),
        JSON.stringify(data.caption || {}),
        data.is_cover || 0,
        data.sort_order || 0,
      ]
    );

    const media = await db.execute(
      'SELECT * FROM media WHERE id = ?',
      [Number(result.lastInsertRowid)]
    );

    return new Response(JSON.stringify(media.rows[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
