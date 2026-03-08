
-- Create study_categories table
CREATE TABLE public.study_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read study_categories"
  ON public.study_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert study_categories"
  ON public.study_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update study_categories"
  ON public.study_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete study_categories"
  ON public.study_categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed default categories
INSERT INTO public.study_categories (name, slug, sort_order) VALUES
  ('Physics', 'physics', 0),
  ('Chemistry', 'chemistry', 1),
  ('Mathematics', 'mathematics', 2),
  ('Biology', 'biology', 3),
  ('Question Bank', 'question-bank', 4),
  ('Model Tests', 'model-tests', 5),
  ('Uncategorized', 'uncategorized', 99);
