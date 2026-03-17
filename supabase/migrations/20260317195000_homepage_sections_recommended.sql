-- Homepage Sections (admin-controlled copy for homepage modules)
CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  title_en TEXT,
  title_bn TEXT,
  subtitle_en TEXT,
  subtitle_bn TEXT,
  badge_en TEXT,
  badge_bn TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Public can read section copy
CREATE POLICY "Anyone can read homepage_sections"
  ON public.homepage_sections FOR SELECT USING (true);

-- Admins can manage section copy
CREATE POLICY "Admins can insert homepage_sections"
  ON public.homepage_sections FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update homepage_sections"
  ON public.homepage_sections FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete homepage_sections"
  ON public.homepage_sections FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Keep updated_at current
DROP TRIGGER IF EXISTS update_homepage_sections_updated_at ON public.homepage_sections;
CREATE TRIGGER update_homepage_sections_updated_at
  BEFORE UPDATE ON public.homepage_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: Recommended section (safe defaults; frontend has its own fallback too)
INSERT INTO public.homepage_sections (
  section_key,
  title_en, title_bn,
  subtitle_en, subtitle_bn,
  badge_en, badge_bn,
  is_active
) VALUES (
  'recommended',
  'Recommended for |Students', 'শিক্ষার্থীদের জন্য |সুপারিশ',
  'Latest articles, study materials, and video lessons', 'সর্বশেষ প্রবন্ধ, স্টাডি ম্যাটেরিয়াল ও ভিডিও লেসন',
  'Recommended', 'সুপারিশ',
  true
)
ON CONFLICT (section_key) DO NOTHING;

