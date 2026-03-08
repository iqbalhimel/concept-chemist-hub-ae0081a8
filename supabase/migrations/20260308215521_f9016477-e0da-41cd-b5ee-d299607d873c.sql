
-- Education table
CREATE TABLE public.education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  degree_title_en TEXT NOT NULL DEFAULT '',
  degree_title_bn TEXT NOT NULL DEFAULT '',
  institution_en TEXT NOT NULL DEFAULT '',
  institution_bn TEXT NOT NULL DEFAULT '',
  cgpa_or_result TEXT NOT NULL DEFAULT '',
  year TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read education" ON public.education FOR SELECT USING (true);
CREATE POLICY "Admins can insert education" ON public.education FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update education" ON public.education FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete education" ON public.education FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Experience table
CREATE TABLE public.experience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_title_en TEXT NOT NULL DEFAULT '',
  job_title_bn TEXT NOT NULL DEFAULT '',
  institution_en TEXT NOT NULL DEFAULT '',
  institution_bn TEXT NOT NULL DEFAULT '',
  duration_en TEXT NOT NULL DEFAULT '',
  duration_bn TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_bn TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read experience" ON public.experience FOR SELECT USING (true);
CREATE POLICY "Admins can insert experience" ON public.experience FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update experience" ON public.experience FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete experience" ON public.experience FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Achievements / Stats table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL DEFAULT '',
  title_bn TEXT NOT NULL DEFAULT '',
  value TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Trophy',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can insert achievements" ON public.achievements FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update achievements" ON public.achievements FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete achievements" ON public.achievements FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Teaching Approach table
CREATE TABLE public.teaching_approach (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT NOT NULL DEFAULT '',
  title_bn TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  description_bn TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Lightbulb',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teaching_approach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read teaching_approach" ON public.teaching_approach FOR SELECT USING (true);
CREATE POLICY "Admins can insert teaching_approach" ON public.teaching_approach FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update teaching_approach" ON public.teaching_approach FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete teaching_approach" ON public.teaching_approach FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Subjects table
CREATE TABLE public.subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'SSC',
  subject_name_en TEXT NOT NULL DEFAULT '',
  subject_name_bn TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins can insert subjects" ON public.subjects FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subjects" ON public.subjects FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete subjects" ON public.subjects FOR DELETE USING (has_role(auth.uid(), 'admin'));
