-- Run this in your Supabase SQL Editor
-- Creates the otp_verifications table for email OTP flow

CREATE TABLE IF NOT EXISTS otp_verifications (
  email       TEXT PRIMARY KEY,
  otp         TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS so backend (anon key) can read/write freely
ALTER TABLE otp_verifications DISABLE ROW LEVEL SECURITY;
