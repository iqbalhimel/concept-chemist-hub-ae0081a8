
-- Add slug column to blog_posts
ALTER TABLE public.blog_posts ADD COLUMN slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX blog_posts_slug_unique ON public.blog_posts (slug);

-- Backfill existing posts with slugs generated from title
UPDATE public.blog_posts
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      REGEXP_REPLACE(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
) || '-' || LEFT(id::text, 8);
