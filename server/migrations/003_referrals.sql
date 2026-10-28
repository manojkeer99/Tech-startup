-- 003_referrals.sql
-- Additive, idempotent migration for THE CREATORS Refer & Earn system

-- 1. Add unique referral_code column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(32);

-- Backfill deterministic unique referral codes for existing users where missing
UPDATE users
SET referral_code = 'TCR-' || UPPER(SUBSTRING(MD5(id || ':' || email) FROM 1 FOR 8))
WHERE referral_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code_unique ON users(referral_code);

-- 2. Add referral attribution columns to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS referred_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(32);

-- 3. Create referrals table for tracking attributed project requests and 10% commissions
CREATE TABLE IF NOT EXISTS referrals (
  id VARCHAR(64) PRIMARY KEY,
  referrer_user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(32) NOT NULL,
  project_id VARCHAR(64) NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  project_public_id VARCHAR(40) NOT NULL UNIQUE,
  client_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  client_name VARCHAR(120) NOT NULL,
  client_email VARCHAR(255) NOT NULL,
  eligible_payment_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.1000,
  commission_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(12) NOT NULL DEFAULT 'USD',
  status VARCHAR(24) NOT NULL DEFAULT 'pending',
  payout_reference VARCHAR(160),
  admin_notes TEXT,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_referral_status CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  CONSTRAINT chk_referral_payment_nonnegative CHECK (eligible_payment_amount >= 0),
  CONSTRAINT chk_referral_commission_nonnegative CHECK (commission_amount >= 0)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_projects_referred_by ON projects(referred_by_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_client_email ON referrals(LOWER(client_email));
