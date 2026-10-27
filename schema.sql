-- The Approved Group v2 — D1 schema
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, role TEXT NOT NULL DEFAULT 'staff',
  pw_hash TEXT NOT NULL, pw_salt TEXT NOT NULL, pw_iter INTEGER NOT NULL DEFAULT 100000,
  created INTEGER NOT NULL, last_login INTEGER
);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  data TEXT NOT NULL DEFAULT '{}', client_token TEXT, client_enabled INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL, updated INTEGER NOT NULL, created_by TEXT
);
CREATE INDEX IF NOT EXISTS projects_updated ON projects(updated);
CREATE UNIQUE INDEX IF NOT EXISTS projects_client ON projects(client_token);
CREATE TABLE IF NOT EXISTS persons (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}', updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS persons_project ON persons(project_id);
CREATE TABLE IF NOT EXISTS families (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, data TEXT NOT NULL DEFAULT '{}', updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS families_project ON families(project_id);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY, project_id TEXT NOT NULL, person_id TEXT, doc_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'needed',
  filename TEXT, mime TEXT, size INTEGER NOT NULL DEFAULT 0, chunks INTEGER NOT NULL DEFAULT 0, notes TEXT,
  created INTEGER NOT NULL, updated INTEGER NOT NULL, uploaded_by TEXT
);
CREATE INDEX IF NOT EXISTS documents_project ON documents(project_id);
CREATE TABLE IF NOT EXISTS doc_chunks (doc_id TEXT NOT NULL, idx INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (doc_id, idx));
CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, ts INTEGER NOT NULL, who TEXT, text TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS activity_project ON activity(project_id, ts);
CREATE TABLE IF NOT EXISTS settings (k TEXT PRIMARY KEY, v TEXT);
CREATE TABLE IF NOT EXISTS login_attempts (k TEXT PRIMARY KEY, n INTEGER NOT NULL, first INTEGER NOT NULL);
