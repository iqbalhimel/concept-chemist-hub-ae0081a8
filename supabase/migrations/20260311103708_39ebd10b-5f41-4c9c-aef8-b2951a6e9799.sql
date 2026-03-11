
-- Visitor sessions table
CREATE TABLE public.visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  ip_address text,
  country text,
  city text,
  latitude double precision,
  longitude double precision,
  device_type text DEFAULT 'Desktop',
  os text,
  browser text,
  screen_resolution text,
  referrer text,
  entry_page text,
  exit_page text,
  pages_viewed integer DEFAULT 1,
  time_spent_seconds integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- Page views table
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Admin read policies
CREATE POLICY "Admins can read visitor_sessions" ON public.visitor_sessions
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read page_views" ON public.page_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_sessions;
