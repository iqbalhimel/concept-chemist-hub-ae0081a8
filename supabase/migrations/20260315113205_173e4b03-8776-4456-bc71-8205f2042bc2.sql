
-- Add scheduling columns to notices (already has expires_at as date, add publish_at as timestamptz)
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS publish_at timestamptz DEFAULT NULL;

-- Add scheduling columns to study_materials
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS publish_at timestamptz DEFAULT NULL;
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS expire_at timestamptz DEFAULT NULL;

-- Add scheduling columns to educational_videos
ALTER TABLE public.educational_videos ADD COLUMN IF NOT EXISTS publish_at timestamptz DEFAULT NULL;
ALTER TABLE public.educational_videos ADD COLUMN IF NOT EXISTS expire_at timestamptz DEFAULT NULL;

-- Add expire_at to blog_posts (already has scheduled_at as publish_at)
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS expire_at timestamptz DEFAULT NULL;
