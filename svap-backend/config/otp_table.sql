CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  otp text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE otp_verifications DISABLE ROW LEVEL SECURITY;
