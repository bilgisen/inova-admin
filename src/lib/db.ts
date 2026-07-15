import { resolve } from 'path';

let client: any = null;

export async function getDb() {
  if (!client) {
    const rawUrl = process.env.TURSO_DB_URL;
    if (rawUrl) {
      const { createClient } = await import('@libsql/client/http');
      client = createClient({
        url: rawUrl.replace(/^libsql:/, 'https:'),
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else {
      const { createClient } = await import('@libsql/client');
      client = createClient({ url: `file:${resolve(process.cwd(), 'data.db')}` });
    }
  }
  return client;
}

export function closeDb() {
  if (client) {
    client.close();
    client = null;
  }
}
