import { createClient } from '@libsql/client';
import { resolve } from 'path';

let client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!client) {
    const url = process.env.TURSO_DB_URL || `file:${resolve(process.cwd(), 'data.db')}`;
    client = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export function closeDb() {
  if (client) {
    client.close();
    client = null;
  }
}
