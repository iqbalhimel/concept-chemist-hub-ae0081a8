
CREATE TABLE public.core_web_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  page_path text NOT NULL,
  metric_name text NOT NULL,
  metric_value double precision NOT NULL,
  rating text,
  device_type text DEFAULT 'Desktop',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.core_web_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert web vitals"
  ON public.core_web_vitals FOR INSERT
  TO public WITH CHECK (true);

CREATE POLICY "Admins can read web vitals"
  ON public.core_web_vitals FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_cwv_created_at ON public.core_web_vitals(created_at DESC);
CREATE INDEX idx_cwv_metric ON public.core_web_vitals(metric_name, created_at DESC);
