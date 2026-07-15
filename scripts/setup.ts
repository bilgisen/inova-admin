import { createClient } from '@libsql/client';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';
import { writeFileSync } from 'fs';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL DEFAULT '{}',
  slug        TEXT UNIQUE NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('project','post','page')),
  description TEXT DEFAULT '{}',
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL DEFAULT '{}',
  slug        TEXT UNIQUE NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL DEFAULT '{}',
  slug            TEXT UNIQUE NOT NULL,
  description     TEXT DEFAULT '{}',
  content         TEXT DEFAULT '{}',
  client          TEXT DEFAULT '{}',
  fair_name       TEXT DEFAULT '{}',
  fair_date       TEXT,
  location        TEXT DEFAULT '{}',
  category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
  sort_order      INTEGER DEFAULT 0,
  is_featured     INTEGER DEFAULT 0,
  meta_title      TEXT DEFAULT '{}',
  meta_description TEXT DEFAULT '{}',
  og_image        TEXT,
  published_at    TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE TABLE IF NOT EXISTS project_tags (
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  tag_id      INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);

CREATE TABLE IF NOT EXISTS media (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  filename          TEXT NOT NULL,
  original_name     TEXT NOT NULL,
  mime_type         TEXT DEFAULT 'image/jpeg',
  url               TEXT NOT NULL,
  cloudinary_pid    TEXT NOT NULL,
  width             INTEGER,
  height            INTEGER,
  file_size         INTEGER,
  alt_text          TEXT DEFAULT '{}',
  caption           TEXT DEFAULT '{}',
  is_cover          INTEGER DEFAULT 0,
  sort_order        INTEGER DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL DEFAULT '{}',
  slug            TEXT UNIQUE NOT NULL,
  content         TEXT DEFAULT '{}',
  excerpt         TEXT DEFAULT '{}',
  category_id     INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
  meta_title      TEXT DEFAULT '{}',
  meta_description TEXT DEFAULT '{}',
  og_image        TEXT,
  published_at    TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE TABLE IF NOT EXISTS post_tags (
  post_id     INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  tag_id      INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS pages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT NOT NULL DEFAULT '{}',
  slug            TEXT UNIQUE NOT NULL,
  content         TEXT DEFAULT '{}',
  status          TEXT DEFAULT 'draft' CHECK(status IN ('draft','published')),
  meta_title      TEXT DEFAULT '{}',
  meta_description TEXT DEFAULT '{}',
  og_image        TEXT,
  published_at    TEXT,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  deleted_at      TEXT
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_sort ON projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_project ON media(project_id);
CREATE INDEX IF NOT EXISTS idx_media_cover ON media(is_cover);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON posts(deleted_at);
CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_deleted ON pages(deleted_at);
`;

const SEED = `
INSERT OR IGNORE INTO categories (name, slug, type, sort_order) VALUES
  ('{"en":"Design","tr":"Tasarım"}', 'design', 'project', 1),
  ('{"en":"Construction","tr":"Uygulama"}', 'construction', 'project', 2),
  ('{"en":"Both","tr":"Hepsi"}', 'both', 'project', 3);

INSERT OR IGNORE INTO tags (name, slug) VALUES
  ('{"en":"Modular","tr":"Modüler"}', 'modular'),
  ('{"en":"Custom","tr":"Özel"}', 'custom'),
  ('{"en":"Exhibition","tr":"Sergi"}', 'exhibition'),
  ('{"en":"Stand","tr":"Stand"}', 'stand');
`;

async function setup() {
  const dbPath = resolve(process.cwd(), 'data.db');
  console.log(`Setting up database at: ${dbPath}`);

  const db = createClient({ url: `file:${dbPath}` });

  const statements = SCHEMA.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try {
      await db.execute(stmt + ';');
      console.log('  ✓', stmt.trim().slice(0, 60) + '...');
    } catch (err) {
      console.error('  ✗', err);
    }
  }

  const seedStatements = SEED.split(';').filter(s => s.trim());
  for (const stmt of seedStatements) {
    try {
      await db.execute(stmt + ';');
    } catch {
      // ignore duplicate errors
    }
  }

  console.log('  ✓ seed data inserted');
  console.log('\n✅ Database setup complete!');
  db.close();
}

async function hashPassword() {
  const password = process.argv[3] || 'admin123';
  const hash = await bcrypt.hash(password, 10);
  console.log(`\nPassword hash for "${password}":`);
  console.log(hash);
  console.log('\nAdd this to ADMIN_USERS in .env:');
  console.log(`[{"username":"admin","password":"${hash}"}]`);
}

async function main() {
  const cmd = process.argv[2];
  if (cmd === 'hash') {
    await hashPassword();
  } else if (cmd === 'seed') {
    await setup();
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/setup.ts          - Run migration + seed');
    console.log('  npx tsx scripts/setup.ts seed     - Run migration + seed');
    console.log('  npx tsx scripts/setup.ts hash     - Generate bcrypt password hash');
    console.log('  npx tsx scripts/setup.ts hash <password> - Generate hash for custom password');
  }
}

main().catch(console.error);
