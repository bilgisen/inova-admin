import { createClient } from '@libsql/client';
import 'dotenv/config';

const db = createClient({
  url: process.env.TURSO_DB_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const schema = `
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

async function migrate() {
  console.log('Running migration...');
  const statements = schema.split(';').filter(s => s.trim());
  for (const stmt of statements) {
    try {
      await db.execute(stmt + ';');
      console.log('OK:', stmt.slice(0, 60) + '...');
    } catch (err) {
      console.error('ERROR:', err);
    }
  }
  console.log('Migration complete');
  process.exit(0);
}

migrate();

export { schema };
