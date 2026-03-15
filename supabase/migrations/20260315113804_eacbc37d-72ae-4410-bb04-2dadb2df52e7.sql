
CREATE TABLE public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  module text NOT NULL,
  item_id text,
  item_title text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read activity log"
  ON public.admin_activity_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert activity log"
  ON public.admin_activity_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_activity_log_created ON public.admin_activity_log (created_at DESC);
CREATE INDEX idx_activity_log_module ON public.admin_activity_log (module);
CREATE INDEX idx_activity_log_action ON public.admin_activity_log (action_type);
