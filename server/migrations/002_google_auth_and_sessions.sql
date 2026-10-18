-- 002_google_auth_and_sessions.sql
-- Additive migration for Google OAuth integration and server-managed persistent sessions

-- 1. Additive columns to users table for Google OAuth provider identity and profile avatar
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(120) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. User sessions table for cryptographically random opaque session tokens (stored as SHA-256 hashes)
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for high-performance session lookup and expiry maintenance
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
