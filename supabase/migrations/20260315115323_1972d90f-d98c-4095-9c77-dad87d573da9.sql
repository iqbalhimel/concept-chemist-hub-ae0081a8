ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS trashed_at timestamptz DEFAULT NULL;
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS trashed_at timestamptz DEFAULT NULL;
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS trashed_at timestamptz DEFAULT NULL;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS trashed_at timestamptz DEFAULT NULL;
ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS trashed_at timestamptz DEFAULT NULL;