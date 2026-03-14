
CREATE TABLE public.educational_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  subject text NOT NULL DEFAULT '',
  class_level text NOT NULL DEFAULT '',
  thumbnail_url text,
  video_source text NOT NULL DEFAULT 'youtube' CHECK (video_source IN ('youtube', 'google_drive', 'upload')),
  video_url text,
  duration text DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.educational_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published videos" ON public.educational_videos
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can insert videos" ON public.educational_videos
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update videos" ON public.educational_videos
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete videos" ON public.educational_videos
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
