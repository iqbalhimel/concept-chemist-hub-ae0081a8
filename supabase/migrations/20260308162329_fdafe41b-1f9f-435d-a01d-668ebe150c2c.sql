
-- ROLE ENUM & USER ROLES TABLE
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Admins can read roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- SITE SETTINGS
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_settings"
  ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can insert site_settings"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site_settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete site_settings"
  ON public.site_settings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTICES
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read notices"
  ON public.notices FOR SELECT USING (true);
CREATE POLICY "Admins can insert notices"
  ON public.notices FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update notices"
  ON public.notices FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete notices"
  ON public.notices FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- STUDY MATERIALS
CREATE TABLE public.study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_url TEXT,
  pages INT,
  file_size TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read study_materials"
  ON public.study_materials FOR SELECT USING (true);
CREATE POLICY "Admins can insert study_materials"
  ON public.study_materials FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update study_materials"
  ON public.study_materials FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete study_materials"
  ON public.study_materials FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_study_materials_updated_at
  BEFORE UPDATE ON public.study_materials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BLOG POSTS
CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  read_time TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog_posts"
  ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Admins can insert blog_posts"
  ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update blog_posts"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete blog_posts"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- GALLERY
CREATE TABLE public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  alt TEXT,
  label TEXT,
  span TEXT DEFAULT 'normal',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read gallery"
  ON public.gallery FOR SELECT USING (true);
CREATE POLICY "Admins can insert gallery"
  ON public.gallery FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update gallery"
  ON public.gallery FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete gallery"
  ON public.gallery FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- FAQ
CREATE TABLE public.faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read faq"
  ON public.faq FOR SELECT USING (true);
CREATE POLICY "Admins can insert faq"
  ON public.faq FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update faq"
  ON public.faq FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete faq"
  ON public.faq FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_faq_updated_at
  BEFORE UPDATE ON public.faq
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- MEDIA LIBRARY
CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read media_library"
  ON public.media_library FOR SELECT USING (true);
CREATE POLICY "Admins can insert media_library"
  ON public.media_library FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update media_library"
  ON public.media_library FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete media_library"
  ON public.media_library FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- THEMES
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  colors JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read themes"
  ON public.themes FOR SELECT USING (true);
CREATE POLICY "Admins can insert themes"
  ON public.themes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update themes"
  ON public.themes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete themes"
  ON public.themes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

CREATE POLICY "Anyone can view media"
  ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Admins can upload media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));

-- SEED DEFAULT THEMES
INSERT INTO public.themes (name, label, colors, is_active) VALUES
('dark-blue', 'Dark Blue', '{"background":"222 47% 7%","foreground":"210 40% 96%","card":"222 40% 12%","card-foreground":"210 40% 96%","primary":"252 80% 65%","primary-foreground":"0 0% 100%","secondary":"222 30% 18%","secondary-foreground":"210 40% 90%","muted":"222 30% 15%","muted-foreground":"215 20% 55%","accent":"200 90% 55%","accent-foreground":"0 0% 100%","destructive":"0 84% 60%","destructive-foreground":"210 40% 98%","border":"222 30% 20%","input":"222 30% 20%","ring":"252 80% 65%"}', true),
('purple-gradient', 'Purple Gradient', '{"background":"270 50% 6%","foreground":"270 20% 96%","card":"270 40% 12%","card-foreground":"270 20% 96%","primary":"280 85% 65%","primary-foreground":"0 0% 100%","secondary":"270 30% 18%","secondary-foreground":"270 20% 90%","muted":"270 30% 15%","muted-foreground":"270 15% 55%","accent":"310 80% 60%","accent-foreground":"0 0% 100%","destructive":"0 84% 60%","destructive-foreground":"210 40% 98%","border":"270 30% 20%","input":"270 30% 20%","ring":"280 85% 65%"}', false),
('green-science', 'Green Science', '{"background":"160 40% 6%","foreground":"160 20% 96%","card":"160 35% 11%","card-foreground":"160 20% 96%","primary":"145 70% 50%","primary-foreground":"0 0% 100%","secondary":"160 25% 18%","secondary-foreground":"160 20% 90%","muted":"160 25% 15%","muted-foreground":"160 15% 55%","accent":"180 70% 50%","accent-foreground":"0 0% 100%","destructive":"0 84% 60%","destructive-foreground":"210 40% 98%","border":"160 25% 20%","input":"160 25% 20%","ring":"145 70% 50%"}', false),
('light-mode', 'Light Mode', '{"background":"0 0% 98%","foreground":"222 47% 11%","card":"0 0% 100%","card-foreground":"222 47% 11%","primary":"252 80% 55%","primary-foreground":"0 0% 100%","secondary":"210 20% 93%","secondary-foreground":"222 47% 20%","muted":"210 20% 96%","muted-foreground":"215 15% 45%","accent":"200 80% 50%","accent-foreground":"0 0% 100%","destructive":"0 84% 60%","destructive-foreground":"0 0% 100%","border":"214 20% 88%","input":"214 20% 88%","ring":"252 80% 55%"}', false),
('dark-mode', 'Dark Mode', '{"background":"0 0% 7%","foreground":"0 0% 95%","card":"0 0% 11%","card-foreground":"0 0% 95%","primary":"252 80% 65%","primary-foreground":"0 0% 100%","secondary":"0 0% 16%","secondary-foreground":"0 0% 90%","muted":"0 0% 14%","muted-foreground":"0 0% 55%","accent":"200 90% 55%","accent-foreground":"0 0% 100%","destructive":"0 84% 60%","destructive-foreground":"0 0% 98%","border":"0 0% 18%","input":"0 0% 18%","ring":"252 80% 65%"}', false);
