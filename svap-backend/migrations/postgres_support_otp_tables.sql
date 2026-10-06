-- PostgreSQL replacements for app-owned OTP and support ticket data.
-- Run as the PostgreSQL table owner/admin. This does not touch payment records.

CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  otp text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_verifications_expires_at_idx
  ON public.otp_verifications (expires_at);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'replied', 'closed')),
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_id_created_at_idx
  ON public.support_tickets (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx
  ON public.support_tickets (status);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.otp_verifications, public.support_tickets
  TO swapt_user;
