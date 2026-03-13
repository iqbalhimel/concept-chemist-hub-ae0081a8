
-- Create security_logs table
CREATE TABLE public.security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  description text NOT NULL DEFAULT '',
  ip_address text,
  user_email text,
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs
CREATE POLICY "Admins can read security_logs"
  ON public.security_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert logs (edge function uses service role, but anon inserts for login attempts)
CREATE POLICY "Service can insert security_logs"
  ON public.security_logs FOR INSERT
  WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_security_logs_created_at ON public.security_logs (created_at DESC);
CREATE INDEX idx_security_logs_event_type ON public.security_logs (event_type);
