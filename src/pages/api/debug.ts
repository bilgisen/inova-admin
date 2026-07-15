import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    TURSO_DB_URL: process.env.TURSO_DB_URL ? 'set:' + process.env.TURSO_DB_URL.slice(0, 30) + '...' : 'NOT SET',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET (' + process.env.TURSO_AUTH_TOKEN.length + ' chars)' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    CWD: process.cwd(),
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
