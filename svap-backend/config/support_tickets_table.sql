-- Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open'::text,
  admin_reply text NULL,
  replied_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id),
  CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES profiles (id) ON DELETE CASCADE,
  CONSTRAINT support_tickets_status_check CHECK (
    status = ANY (ARRAY['open'::text, 'replied'::text, 'closed'::text])
  )
) TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create tickets
CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx 
  ON public.support_tickets (user_id);

CREATE INDEX IF NOT EXISTS support_tickets_status_idx 
  ON public.support_tickets (status);
