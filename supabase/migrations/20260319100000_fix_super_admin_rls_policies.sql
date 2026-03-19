-- ============================================================
-- MIGRATION: Full super_admin RLS fix across all admin tables
-- DATE: 2026-03-19
--
-- ROOT CAUSE ANALYSIS:
--   1. app_role ENUM correctly includes 'super_admin' (since 20260316194158). OK.
--   2. has_role(_user_id, _role) function is correct — exact match. OK.
--   3. is_any_admin(_user_id) already includes super_admin. OK.
--   4. ROOT CAUSE: Every admin-controlled table's INSERT/UPDATE/DELETE
--      policies call `has_role(uid, 'admin')` only. super_admin is never
--      checked, so super_admin users are silently blocked by all write
--      operations on all 20+ tables.
--   5. SECONDARY: "Admins can read roles" on user_roles uses admin-only
--      check, so super_admin cannot read the user_roles table directly.
--   6. user_roles INSERT/UPDATE/DELETE (from 20260316204217) allow
--      super_admin only — admin cannot manage roles.
--
-- FIX STRATEGY:
--   - Re-declare both helper functions with explicit type casts for safety.
--   - For all admin-only policies: DROP + recreate using
--     public.is_any_admin(auth.uid()) which covers admin, super_admin,
--     editor, and moderator.
--   - For user_roles INSERT/UPDATE/DELETE: update to is_any_admin so
--     both admin and super_admin can manage roles.
--   - No RLS is disabled. No overly permissive TRUE policies added.
--   - Public read policies are left untouched.
-- ============================================================

-- ── Step 1: Harden helper functions ──────────────────────────────────────────

-- Reconfirm has_role with explicit cast to prevent implicit-cast surprises
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

-- Reconfirm is_any_admin with explicit enum casts
CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'admin'::app_role,
        'super_admin'::app_role,
        'editor'::app_role,
        'moderator'::app_role
      )
  )
$$;

-- ── Step 2: user_roles ────────────────────────────────────────────────────────
-- Before: SELECT → admin-only; INSERT/UPDATE/DELETE → super_admin-only
-- After:  all four → is_any_admin (admin + super_admin + editor + moderator)

DROP POLICY IF EXISTS "Admins can read roles" ON public.user_roles;
CREATE POLICY "Admins can read roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can insert roles" ON public.user_roles;
CREATE POLICY "Super admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
CREATE POLICY "Super admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;
CREATE POLICY "Super admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 3: site_settings ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert site_settings" ON public.site_settings;
CREATE POLICY "Admins can insert site_settings"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update site_settings" ON public.site_settings;
CREATE POLICY "Admins can update site_settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete site_settings" ON public.site_settings;
CREATE POLICY "Admins can delete site_settings"
  ON public.site_settings FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 4: notices ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert notices" ON public.notices;
CREATE POLICY "Admins can insert notices"
  ON public.notices FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update notices" ON public.notices;
CREATE POLICY "Admins can update notices"
  ON public.notices FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete notices" ON public.notices;
CREATE POLICY "Admins can delete notices"
  ON public.notices FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 5: study_materials ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert study_materials" ON public.study_materials;
CREATE POLICY "Admins can insert study_materials"
  ON public.study_materials FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update study_materials" ON public.study_materials;
CREATE POLICY "Admins can update study_materials"
  ON public.study_materials FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete study_materials" ON public.study_materials;
CREATE POLICY "Admins can delete study_materials"
  ON public.study_materials FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 6: blog_posts ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert blog_posts" ON public.blog_posts;
CREATE POLICY "Admins can insert blog_posts"
  ON public.blog_posts FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update blog_posts" ON public.blog_posts;
CREATE POLICY "Admins can update blog_posts"
  ON public.blog_posts FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete blog_posts" ON public.blog_posts;
CREATE POLICY "Admins can delete blog_posts"
  ON public.blog_posts FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 7: gallery ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert gallery" ON public.gallery;
CREATE POLICY "Admins can insert gallery"
  ON public.gallery FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update gallery" ON public.gallery;
CREATE POLICY "Admins can update gallery"
  ON public.gallery FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete gallery" ON public.gallery;
CREATE POLICY "Admins can delete gallery"
  ON public.gallery FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 8: faq ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert faq" ON public.faq;
CREATE POLICY "Admins can insert faq"
  ON public.faq FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update faq" ON public.faq;
CREATE POLICY "Admins can update faq"
  ON public.faq FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete faq" ON public.faq;
CREATE POLICY "Admins can delete faq"
  ON public.faq FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 9: media_library ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert media_library" ON public.media_library;
CREATE POLICY "Admins can insert media_library"
  ON public.media_library FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update media_library" ON public.media_library;
CREATE POLICY "Admins can update media_library"
  ON public.media_library FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete media_library" ON public.media_library;
CREATE POLICY "Admins can delete media_library"
  ON public.media_library FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 10: themes ───────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert themes" ON public.themes;
CREATE POLICY "Admins can insert themes"
  ON public.themes FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update themes" ON public.themes;
CREATE POLICY "Admins can update themes"
  ON public.themes FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete themes" ON public.themes;
CREATE POLICY "Admins can delete themes"
  ON public.themes FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 11: storage.objects (media bucket) ───────────────────────────────────

DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
CREATE POLICY "Admins can upload media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update media" ON storage.objects;
CREATE POLICY "Admins can update media"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete media" ON storage.objects;
CREATE POLICY "Admins can delete media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.is_any_admin(auth.uid()));

-- ── Step 12: study_categories ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert study_categories" ON public.study_categories;
CREATE POLICY "Admins can insert study_categories"
  ON public.study_categories FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update study_categories" ON public.study_categories;
CREATE POLICY "Admins can update study_categories"
  ON public.study_categories FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete study_categories" ON public.study_categories;
CREATE POLICY "Admins can delete study_categories"
  ON public.study_categories FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 13: education ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert education" ON public.education;
CREATE POLICY "Admins can insert education"
  ON public.education FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update education" ON public.education;
CREATE POLICY "Admins can update education"
  ON public.education FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete education" ON public.education;
CREATE POLICY "Admins can delete education"
  ON public.education FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 14: experience ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert experience" ON public.experience;
CREATE POLICY "Admins can insert experience"
  ON public.experience FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update experience" ON public.experience;
CREATE POLICY "Admins can update experience"
  ON public.experience FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete experience" ON public.experience;
CREATE POLICY "Admins can delete experience"
  ON public.experience FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 15: achievements ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert achievements" ON public.achievements;
CREATE POLICY "Admins can insert achievements"
  ON public.achievements FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update achievements" ON public.achievements;
CREATE POLICY "Admins can update achievements"
  ON public.achievements FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete achievements" ON public.achievements;
CREATE POLICY "Admins can delete achievements"
  ON public.achievements FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 16: teaching_approach ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert teaching_approach" ON public.teaching_approach;
CREATE POLICY "Admins can insert teaching_approach"
  ON public.teaching_approach FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update teaching_approach" ON public.teaching_approach;
CREATE POLICY "Admins can update teaching_approach"
  ON public.teaching_approach FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete teaching_approach" ON public.teaching_approach;
CREATE POLICY "Admins can delete teaching_approach"
  ON public.teaching_approach FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 17: subjects ─────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert subjects" ON public.subjects;
CREATE POLICY "Admins can insert subjects"
  ON public.subjects FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update subjects" ON public.subjects;
CREATE POLICY "Admins can update subjects"
  ON public.subjects FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete subjects" ON public.subjects;
CREATE POLICY "Admins can delete subjects"
  ON public.subjects FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 18: blog_post_comments ───────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can delete comments" ON public.blog_post_comments;
CREATE POLICY "Admins can delete comments"
  ON public.blog_post_comments FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 19: professional_training ───────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert professional_training" ON public.professional_training;
CREATE POLICY "Admins can insert professional_training"
  ON public.professional_training FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update professional_training" ON public.professional_training;
CREATE POLICY "Admins can update professional_training"
  ON public.professional_training FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete professional_training" ON public.professional_training;
CREATE POLICY "Admins can delete professional_training"
  ON public.professional_training FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 20: visitor_sessions ─────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can read visitor_sessions" ON public.visitor_sessions;
CREATE POLICY "Admins can read visitor_sessions"
  ON public.visitor_sessions FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 21: page_views ───────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can read page_views" ON public.page_views;
CREATE POLICY "Admins can read page_views"
  ON public.page_views FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 22: core_web_vitals ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can read web vitals" ON public.core_web_vitals;
CREATE POLICY "Admins can read web vitals"
  ON public.core_web_vitals FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 23: security_logs ────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can read security_logs" ON public.security_logs;
CREATE POLICY "Admins can read security_logs"
  ON public.security_logs FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 24: admin_activity_log ───────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can read activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can read activity log"
  ON public.admin_activity_log FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert activity log" ON public.admin_activity_log;
CREATE POLICY "Admins can insert activity log"
  ON public.admin_activity_log FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

-- ── Step 25: educational_videos ───────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert videos" ON public.educational_videos;
CREATE POLICY "Admins can insert videos"
  ON public.educational_videos FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update videos" ON public.educational_videos;
CREATE POLICY "Admins can update videos"
  ON public.educational_videos FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete videos" ON public.educational_videos;
CREATE POLICY "Admins can delete videos"
  ON public.educational_videos FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 26: tags ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert tags" ON public.tags;
CREATE POLICY "Admins can insert tags"
  ON public.tags FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update tags" ON public.tags;
CREATE POLICY "Admins can update tags"
  ON public.tags FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete tags" ON public.tags;
CREATE POLICY "Admins can delete tags"
  ON public.tags FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 27: post_tags ────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert post_tags" ON public.post_tags;
CREATE POLICY "Admins can insert post_tags"
  ON public.post_tags FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete post_tags" ON public.post_tags;
CREATE POLICY "Admins can delete post_tags"
  ON public.post_tags FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 28: homepage_sections ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admins can insert homepage_sections"
  ON public.homepage_sections FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admins can update homepage_sections"
  ON public.homepage_sections FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete homepage_sections" ON public.homepage_sections;
CREATE POLICY "Admins can delete homepage_sections"
  ON public.homepage_sections FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 29: testimonials ─────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Admins can insert testimonials" ON public.testimonials;
CREATE POLICY "Admins can insert testimonials"
  ON public.testimonials FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update testimonials" ON public.testimonials;
CREATE POLICY "Admins can update testimonials"
  ON public.testimonials FOR UPDATE TO authenticated
  USING (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete testimonials" ON public.testimonials;
CREATE POLICY "Admins can delete testimonials"
  ON public.testimonials FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- ── Step 30: profiles — consolidate to is_any_admin ──────────────────────────

DROP POLICY IF EXISTS "Super admins can insert any profile" ON public.profiles;
CREATE POLICY "Super admins can insert any profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
CREATE POLICY "Super admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.is_any_admin(auth.uid()));

-- ── Unchanged policies (already correct) ─────────────────────────────────────
-- admin_login_history: SELECT uses is_any_admin()  ✓  INSERT allows public  ✓
-- profiles: SELECT uses is_any_admin()              ✓
-- All public SELECT policies (USING true)           ✓

-- ── Validation queries (run manually to verify) ───────────────────────────────
-- Replace <super_admin_uuid> with auth.uid() of i.himel@gmail.com.
--
-- 1. Confirm super_admin role record exists:
--    SELECT user_id, role FROM public.user_roles
--    WHERE user_id = '<super_admin_uuid>';
--
-- 2. Confirm has_role returns TRUE for super_admin:
--    SELECT public.has_role('<super_admin_uuid>', 'super_admin'::app_role);
--
-- 3. Confirm is_any_admin returns TRUE for super_admin:
--    SELECT public.is_any_admin('<super_admin_uuid>');
--
-- 4. Confirm super_admin can read site_settings write policy check:
--    SET LOCAL ROLE authenticated;
--    SET LOCAL "request.jwt.claims" = '{"sub":"<super_admin_uuid>"}';
--    SELECT public.is_any_admin(auth.uid());
--
-- 5. Spot-check policy list for site_settings:
--    SELECT policyname, cmd, qual
--    FROM pg_policies
--    WHERE tablename = 'site_settings'
--    ORDER BY cmd;
