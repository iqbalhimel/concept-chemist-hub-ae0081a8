
ALTER TABLE public.media_library 
  ADD COLUMN IF NOT EXISTS folder text NOT NULL DEFAULT 'Uncategorized',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
