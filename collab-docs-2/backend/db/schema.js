const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'collab-docs.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         TEXT PRIMARY KEY,
    username   TEXT UNIQUE NOT NULL COLLATE NOCASE,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS documents (
    id           TEXT PRIMARY KEY,
    owner_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        TEXT NOT NULL DEFAULT 'Untitled Document',
    content      TEXT NOT NULL DEFAULT '',
    content_type TEXT NOT NULL DEFAULT 'richtext',  -- 'richtext' | 'markdown' | 'plaintext'
    created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS shares (
    id          TEXT PRIMARY KEY,
    doc_id      TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_by   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission  TEXT NOT NULL CHECK(permission IN ('view', 'edit')),
    created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(doc_id, shared_with)
  );

  CREATE INDEX IF NOT EXISTS idx_documents_owner    ON documents(owner_id);
  CREATE INDEX IF NOT EXISTS idx_documents_updated  ON documents(updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_shares_doc         ON shares(doc_id);
  CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON shares(shared_with);
`);

module.exports = db;
