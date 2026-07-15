import type { APIRoute } from 'astro';
import { getDb } from '../../../../lib/db';
import { reorderSchema } from '../../../../lib/validation';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const parsed = reorderSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({
        error: 'Validation failed',
        details: parsed.error.flatten(),
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const db = await getDb();
    const { items } = parsed.data;

    const stmt = 'UPDATE projects SET sort_order = ?, updated_at = ? WHERE id = ?';
    const now = new Date().toISOString();

    await db.batch(
      items.map(item => ({
        sql: stmt,
        args: [item.sort_order, now, item.id],
      }))
    );

    return new Response(JSON.stringify({ success: true }), {
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
