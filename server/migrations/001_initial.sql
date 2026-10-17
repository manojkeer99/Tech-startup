-- 001_initial.sql
-- Safe migration: preserves all existing data and creates missing tables/indexes only

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(40),
  age INTEGER,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'client',
  token_balance INTEGER NOT NULL DEFAULT 0,
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(40) NOT NULL UNIQUE,
  client_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  client_name VARCHAR(120) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  client_phone VARCHAR(40),
  age INTEGER,
  service VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  budget VARCHAR(80),
  deadline VARCHAR(80),
  references_text TEXT,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  status VARCHAR(40) NOT NULL DEFAULT 'submitted',
  progress INTEGER NOT NULL DEFAULT 0,
  token_charged INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_updates (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_name VARCHAR(120) NOT NULL,
  author_role VARCHAR(40) NOT NULL DEFAULT 'admin',
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_transactions (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  project_id VARCHAR(40),
  idempotency_key VARCHAR(120) UNIQUE,
  created_by_id VARCHAR(64),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  project_id VARCHAR(40),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  detail TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_resets (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS services (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  price_range VARCHAR(80) NOT NULL DEFAULT '',
  token_cost INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(80) PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_token_tx_client_id ON token_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at DESC);
