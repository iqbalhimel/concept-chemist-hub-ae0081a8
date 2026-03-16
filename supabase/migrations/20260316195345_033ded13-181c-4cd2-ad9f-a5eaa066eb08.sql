
-- Create admin_login_history table
CREATE TABLE public.admin_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  login_time timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  device_info text,
  location text,
  success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_login_history ENABLE ROW LEVEL SECURITY;

-- Only admins can read login history
CREATE POLICY "Admins can read login history"
  ON public.admin_login_history FOR SELECT TO authenticated
  USING (is_any_admin(auth.uid()));

-- Service/edge functions can insert (public insert for edge function with service role)
CREATE POLICY "Service can insert login history"
  ON public.admin_login_history FOR INSERT
  WITH CHECK (true);
