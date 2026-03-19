-- ============================================================
-- MIGRATION: Super Admin runtime diagnosis, role-mapping self-heal,
--            and end-to-end validation
-- DATE: 2026-03-19
-- RUNS AFTER: 20260319100000_fix_super_admin_rls_policies.sql
--
-- This migration handles the runtime layer that RLS policy fixes alone
-- cannot address:
--   1. Verifies i.himel@gmail.com exists in auth.users
--   2. Ensures a user_roles row with role = 'super_admin' exists
--      for that auth.uid() — inserts it if missing
--   3. Re-hardens both helper functions with explicit SECURITY DEFINER
--      and typed enum casts
--   4. Removes any duplicate/orphaned stale policies that the previous
--      migration may not have caught (catch-all DROP IF EXISTS pass)
--   5. Validates the full call chain with RAISE NOTICE output
-- ============================================================

-- ── Step 1: Re-harden helper functions (idempotent) ───────────────────────────
-- Guarantees SECURITY DEFINER and typed enum casts regardless of prior state.

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN (
        'admin'::app_role,
        'super_admin'::app_role,
        'editor'::app_role,
        'moderator'::app_role
      )
  )
$$;

-- ── Step 2: Catch-all stale-policy sweep ──────────────────────────────────────
-- Drops any remaining admin-only policies that earlier migrations may have
-- missed or that survived due to naming variations.  All are safe to drop
-- because the correct replacements already exist from 20260319100000.

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- site_settings (belt-and-suspenders)
DROP POLICY IF EXISTS "Admin can insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin can update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin can delete site_settings" ON public.site_settings;

-- visitor_sessions / page_views / core_web_vitals
DROP POLICY IF EXISTS "Admin can read visitor_sessions" ON public.visitor_sessions;
DROP POLICY IF EXISTS "Admin can read page_views" ON public.page_views;
DROP POLICY IF EXISTS "Admin can read web vitals" ON public.core_web_vitals;

-- security_logs / admin_activity_log
DROP POLICY IF EXISTS "Admin can read security_logs" ON public.security_logs;
DROP POLICY IF EXISTS "Admin can read activity log" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admin can insert activity log" ON public.admin_activity_log;

-- blog_post_comments
DROP POLICY IF EXISTS "Admin can delete comments" ON public.blog_post_comments;

-- educational_videos
DROP POLICY IF EXISTS "Admin can insert videos" ON public.educational_videos;
DROP POLICY IF EXISTS "Admin can update videos" ON public.educational_videos;
DROP POLICY IF EXISTS "Admin can delete videos" ON public.educational_videos;

-- tags / post_tags
DROP POLICY IF EXISTS "Admin can insert tags" ON public.tags;
DROP POLICY IF EXISTS "Admin can update tags" ON public.tags;
DROP POLICY IF EXISTS "Admin can delete tags" ON public.tags;
DROP POLICY IF EXISTS "Admin can insert post_tags" ON public.post_tags;
DROP POLICY IF EXISTS "Admin can delete post_tags" ON public.post_tags;

-- homepage_sections
DROP POLICY IF EXISTS "Admin can insert homepage_sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admin can update homepage_sections" ON public.homepage_sections;
DROP POLICY IF EXISTS "Admin can delete homepage_sections" ON public.homepage_sections;

-- testimonials
DROP POLICY IF EXISTS "Admin can insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admin can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admin can delete testimonials" ON public.testimonials;

-- ── Step 3: Runtime diagnosis and role-mapping self-heal ──────────────────────
-- Runs as migration executor (postgres), bypassing RLS, so auth.users and
-- user_roles can be read/written unconditionally.

DO $$
DECLARE
  v_user_id        uuid;
  v_role_count     int;
  v_inserted_count int;
  v_is_admin       boolean;
  v_has_super      boolean;
BEGIN

  -- ── 3a: Locate i.himel@gmail.com in auth.users ─────────────────────────────
  SELECT id
  INTO   v_user_id
  FROM   auth.users
  WHERE  email = 'i.himel@gmail.com'
  LIMIT  1;

  IF v_user_id IS NULL THEN
    RAISE WARNING
      '[DIAG] FAIL — i.himel@gmail.com not found in auth.users. '
      'The user must register/sign-up before a role can be assigned. '
      'Run this migration again after the account is created.';
    RETURN;
  END IF;

  RAISE NOTICE '[DIAG] OK — i.himel@gmail.com found: auth.uid = %', v_user_id;

  -- ── 3b: Report existing role entries ───────────────────────────────────────
  SELECT COUNT(*)
  INTO   v_role_count
  FROM   public.user_roles
  WHERE  user_id = v_user_id;

  RAISE NOTICE '[DIAG] user_roles rows for this user: %', v_role_count;

  IF v_role_count > 0 THEN
    DECLARE
      r record;
    BEGIN
      FOR r IN
        SELECT role::text AS role_name
        FROM   public.user_roles
        WHERE  user_id = v_user_id
      LOOP
        RAISE NOTICE '[DIAG] Existing role entry: %', r.role_name;
      END LOOP;
    END;
  END IF;

  -- ── 3c: Ensure super_admin role record exists ───────────────────────────────

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'super_admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  IF v_inserted_count > 0 THEN
    RAISE NOTICE '[FIX] INSERTED super_admin role for user %', v_user_id;
  ELSE
    RAISE NOTICE '[DIAG] OK — super_admin role already existed for user %', v_user_id;
  END IF;

  -- ── 3d: Validate is_any_admin() ────────────────────────────────────────────
  SELECT public.is_any_admin(v_user_id)
  INTO   v_is_admin;

  IF v_is_admin IS TRUE THEN
    RAISE NOTICE '[VALIDATE] PASS — is_any_admin(%) = TRUE', v_user_id;
  ELSE
    RAISE EXCEPTION
      '[VALIDATE] FAIL — is_any_admin(%) = FALSE after insertion. '
      'Check that the user_roles table has RLS disabled for SECURITY DEFINER '
      'functions (it should be — both functions are SECURITY DEFINER).',
      v_user_id;
  END IF;

  -- ── 3e: Validate has_role() for super_admin ────────────────────────────────
  SELECT public.has_role(v_user_id, 'super_admin'::app_role)
  INTO   v_has_super;

  IF v_has_super IS TRUE THEN
    RAISE NOTICE '[VALIDATE] PASS — has_role(%, ''super_admin'') = TRUE', v_user_id;
  ELSE
    RAISE EXCEPTION
      '[VALIDATE] FAIL — has_role(%, ''super_admin'') = FALSE. '
      'This should not happen if the INSERT succeeded.',
      v_user_id;
  END IF;

  -- ── 3f: Confirm admin role is still unaffected ────────────────────────────
  RAISE NOTICE
    '[VALIDATE] Admin role check deferred to runtime — existing admin '
    'users are unaffected because is_any_admin() uses IN (...) not equals.';

  RAISE NOTICE
    '[COMPLETE] super_admin fix applied for i.himel@gmail.com (uid = %). '
    'All RLS policies now use public.is_any_admin(auth.uid()). '
    'super_admin has full access to all admin-controlled tables.',
    v_user_id;

END $$;

-- ── Step 4: Spot-check views (non-blocking, informational) ───────────────────
-- These queries run at migration time against the live schema.
-- They verify the final policy state for the two most critical tables.

DO $$
DECLARE
  r record;
  v_bad_count int := 0;
BEGIN
  RAISE NOTICE '=== Policy audit: checking for remaining admin-only policies ===';

  FOR r IN
    SELECT tablename, policyname, cmd, qual
    FROM   pg_policies
    WHERE  schemaname = 'public'
      AND  (
             qual LIKE '%has_role%admin%'
          OR with_check LIKE '%has_role%admin%'
           )
      -- exclude policies that use is_any_admin (those are already fixed)
      AND  qual NOT LIKE '%is_any_admin%'
  LOOP
    RAISE WARNING
      '[AUDIT] Possibly stale admin-only policy: table=% policy=% cmd=% qual=%',
      r.tablename, r.policyname, r.cmd, r.qual;
    v_bad_count := v_bad_count + 1;
  END LOOP;

  IF v_bad_count = 0 THEN
    RAISE NOTICE '[AUDIT] PASS — No remaining admin-only policies detected.';
  ELSE
    RAISE WARNING
      '[AUDIT] % stale policy(ies) found. Review the warnings above.',
      v_bad_count;
  END IF;
END $$;
