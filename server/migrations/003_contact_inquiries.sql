-- 003_contact_inquiries.sql
-- Additive schema for durable contact-form submissions. Existing data is untouched.

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at
  ON contact_inquiries(created_at DESC);
