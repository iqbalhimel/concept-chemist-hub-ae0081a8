
-- Lightweight content view/download tracking
CREATE TABLE public.content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL, -- 'blog_post', 'study_material', 'video'
  content_id uuid NOT NULL,
  view_count integer NOT NULL DEFAULT 0,
  UNIQUE (content_type, content_id)
);

ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

-- Anyone can read view counts
CREATE POLICY "Anyone can read content_views"
  ON public.content_views FOR SELECT TO public USING (true);

-- Anyone can insert (upsert) view counts
CREATE POLICY "Anyone can insert content_views"
  ON public.content_views FOR INSERT TO public WITH CHECK (true);

-- Anyone can update view counts (increment)
CREATE POLICY "Anyone can update content_views"
  ON public.content_views FOR UPDATE TO public USING (true);

-- Function to increment view count atomically
CREATE OR REPLACE FUNCTION public.increment_view_count(p_content_type text, p_content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.content_views (content_type, content_id, view_count)
  VALUES (p_content_type, p_content_id, 1)
  ON CONFLICT (content_type, content_id)
  DO UPDATE SET view_count = content_views.view_count + 1;
END;
$$;
