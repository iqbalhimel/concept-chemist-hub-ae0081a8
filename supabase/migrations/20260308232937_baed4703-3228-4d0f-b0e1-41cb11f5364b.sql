-- Fix: Drop restrictive SELECT policies and recreate as permissive for all affected tables

-- subjects
DROP POLICY IF EXISTS "Anyone can read subjects" ON public.subjects;
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT USING (true);

-- teaching_approach
DROP POLICY IF EXISTS "Anyone can read teaching_approach" ON public.teaching_approach;
CREATE POLICY "Anyone can read teaching_approach" ON public.teaching_approach FOR SELECT USING (true);

-- achievements
DROP POLICY IF EXISTS "Anyone can read achievements" ON public.achievements;
CREATE POLICY "Anyone can read achievements" ON public.achievements FOR SELECT USING (true);

-- experience
DROP POLICY IF EXISTS "Anyone can read experience" ON public.experience;
CREATE POLICY "Anyone can read experience" ON public.experience FOR SELECT USING (true);

-- Also fix other public-read tables that have the same issue
-- education
DROP POLICY IF EXISTS "Anyone can read education" ON public.education;
CREATE POLICY "Anyone can read education" ON public.education FOR SELECT USING (true);

-- gallery
DROP POLICY IF EXISTS "Anyone can read gallery" ON public.gallery;
CREATE POLICY "Anyone can read gallery" ON public.gallery FOR SELECT USING (true);

-- testimonials
DROP POLICY IF EXISTS "Anyone can read testimonials" ON public.testimonials;
CREATE POLICY "Anyone can read testimonials" ON public.testimonials FOR SELECT USING (true);

-- notices
DROP POLICY IF EXISTS "Anyone can read notices" ON public.notices;
CREATE POLICY "Anyone can read notices" ON public.notices FOR SELECT USING (true);

-- faq
DROP POLICY IF EXISTS "Anyone can read faq" ON public.faq;
CREATE POLICY "Anyone can read faq" ON public.faq FOR SELECT USING (true);

-- blog_posts
DROP POLICY IF EXISTS "Anyone can read blog_posts" ON public.blog_posts;
CREATE POLICY "Anyone can read blog_posts" ON public.blog_posts FOR SELECT USING (true);

-- blog_post_comments
DROP POLICY IF EXISTS "Anyone can read comments" ON public.blog_post_comments;
CREATE POLICY "Anyone can read comments" ON public.blog_post_comments FOR SELECT USING (true);

-- blog_post_reactions
DROP POLICY IF EXISTS "Anyone can read reactions" ON public.blog_post_reactions;
CREATE POLICY "Anyone can read reactions" ON public.blog_post_reactions FOR SELECT USING (true);

-- site_settings
DROP POLICY IF EXISTS "Anyone can read site_settings" ON public.site_settings;
CREATE POLICY "Anyone can read site_settings" ON public.site_settings FOR SELECT USING (true);

-- study_categories
DROP POLICY IF EXISTS "Anyone can read study_categories" ON public.study_categories;
CREATE POLICY "Anyone can read study_categories" ON public.study_categories FOR SELECT USING (true);

-- study_materials
DROP POLICY IF EXISTS "Anyone can read study_materials" ON public.study_materials;
CREATE POLICY "Anyone can read study_materials" ON public.study_materials FOR SELECT USING (true);

-- themes
DROP POLICY IF EXISTS "Anyone can read themes" ON public.themes;
CREATE POLICY "Anyone can read themes" ON public.themes FOR SELECT USING (true);

-- media_library
DROP POLICY IF EXISTS "Anyone can read media_library" ON public.media_library;
CREATE POLICY "Anyone can read media_library" ON public.media_library FOR SELECT USING (true);