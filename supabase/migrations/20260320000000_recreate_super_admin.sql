-- ============================================================
-- MIGRATION: Complete super-admin reset for i.h.himel@gmail.com
-- DATE: 2026-03-20
--
-- WHAT THIS DOES:
--   1. Removes every public-table record tied to i.h.himel@gmail.com
--      (user_roles, admin_login_history, profiles).
--      auth.users deletion is done manually in the Supabase Dashboard.
--   2. Hardens get_admin_role() with a deterministic ORDER BY so
--      super_admin is always returned first when multiple rows exist.
--   3. Installs / replaces the auto-assign trigger:
--      whenever i.h.himel@gmail.com signs up / is invited, the
--      trigger inserts super_admin into user_roles automatically.
--   4. Re-creates the profile row for the new account on signup.
--   5. Runs a final validation pass.
--
-- AFTER RUNNING THIS MIGRATION:
--   a. Supabase Dashboard → Authentication → Users
--   b. Find i.h.himel@gmail.com and DELETE that user.
--   c. Click "Invite User", enter i.h.himel@gmail.com.
--   d. Accept the invite email, set a new password.
--   → The trigger fires automatically and assigns super_admin.
--   → Log in — the panel will show "Super Admin" with full access.
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- STEP 1: Remove all public-table data for i.h.himel@gmail.com
--         (Wrapped in exception handler to avoid relation errors)
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid uuid;
BEGIN
  -- Try to find the user in auth.users
  BEGIN
    SELECT id INTO v_uid
    FROM   auth.users
    WHERE  email = 'i.h.himel@gmail.com'
    LIMIT  1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[RESET] Could not query auth.users (may not have permission). Skipping cleanup.';
    RETURN;
  END;

  IF v_uid IS NULL THEN
    RAISE NOTICE '[RESET] i.h.himel@gmail.com not found in auth.users — skipping cleanup (nothing to remove).';
    RETURN;
  END IF;

  RAISE NOTICE '[RESET] Found i.h.himel@gmail.com → uid = %', v_uid;

  -- Remove all role assignments (if table exists)
  BEGIN
    DELETE FROM public.user_roles WHERE user_id = v_uid;
    RAISE NOTICE '[RESET] user_roles cleared.';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '[RESET] user_roles table does not exist yet — skipping.';
  END;

  -- Remove login history (if table exists)
  BEGIN
    DELETE FROM public.admin_login_history WHERE admin_id = v_uid;
    RAISE NOTICE '[RESET] admin_login_history cleared.';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '[RESET] admin_login_history table does not exist yet — skipping.';
  END;

  -- Remove profile (if table exists)
  BEGIN
    DELETE FROM public.profiles WHERE user_id = v_uid;
    RAISE NOTICE '[RESET] profiles cleared.';
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '[RESET] profiles table does not exist yet — skipping.';
  END;

  RAISE NOTICE '[RESET] ✓ All public-table records removed for uid = %', v_uid;
  RAISE NOTICE '[ACTION] Now delete i.h.himel@gmail.com in Supabase Auth and invite again.';
END $$;


-- ══════════════════════════════════════════════════════════════
-- STEP 2: Fix get_admin_role() — add deterministic ORDER BY
--         so super_admin always wins over other roles
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM   public.user_roles
  WHERE  user_id = _user_id
    AND  role IN (
           'super_admin'::app_role,
           'admin'::app_role,
           'editor'::app_role,
           'moderator'::app_role
         )
  ORDER BY
    CASE role::text
      WHEN 'super_admin' THEN 1
      WHEN 'admin'       THEN 2
      WHEN 'editor'      THEN 3
      WHEN 'moderator'   THEN 4
      ELSE                    5
    END
  LIMIT 1
$$;


-- ══════════════════════════════════════════════════════════════
-- STEP 3: Auto-assign trigger function
--         Fires after every INSERT on auth.users.
--         If the new email is i.h.himel@gmail.com, inserts:
--           • super_admin row in user_roles
--           • a baseline profile row
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_super_admin_auto_assign()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'i.h.himel@gmail.com' THEN

    -- Assign super_admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Create baseline profile (name can be updated in the panel)
    INSERT INTO public.profiles (user_id, name, created_at, updated_at)
    VALUES (NEW.id, 'Super Admin', now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET name       = EXCLUDED.name,
          updated_at = now();

  END IF;
  RETURN NEW;
END;
$$;


-- ══════════════════════════════════════════════════════════════
-- STEP 4: Attach (or replace) trigger on auth.users
-- ══════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS on_super_admin_auto_assign ON auth.users;

CREATE TRIGGER on_super_admin_auto_assign
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_super_admin_auto_assign();


-- ══════════════════════════════════════════════════════════════
-- STEP 5: Re-harden is_any_admin() and has_role() (idempotent)
--         Ensures typed enum casts are in place after any
--         previous migration that may have omitted them.
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.is_any_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.user_roles
    WHERE  user_id = _user_id
      AND  role IN (
             'admin'::app_role,
             'super_admin'::app_role,
             'editor'::app_role,
             'moderator'::app_role
           )
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.user_roles
    WHERE  user_id = _user_id
      AND  role = _role
  )
$$;


-- ══════════════════════════════════════════════════════════════
-- STEP 6: Re-verify site_settings write policies
--         (belt-and-suspenders — ensures the upsert in
--          AdminAtmosphere and similar panels is never blocked)
-- ══════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "Admins can insert site_settings" ON public.site_settings;
CREATE POLICY "Admins can insert site_settings"
  ON public.site_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update site_settings" ON public.site_settings;
CREATE POLICY "Admins can update site_settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING  (public.is_any_admin(auth.uid()))
  WITH CHECK (public.is_any_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete site_settings" ON public.site_settings;
CREATE POLICY "Admins can delete site_settings"
  ON public.site_settings FOR DELETE TO authenticated
  USING (public.is_any_admin(auth.uid()));


-- ══════════════════════════════════════════════════════════════
-- STEP 7: Final validation
-- ══════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_uid          uuid;
  v_trigger_ok   boolean;
BEGIN
  -- Check trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE  tgname = 'on_super_admin_auto_assign'
  ) INTO v_trigger_ok;

  IF v_trigger_ok THEN
    RAISE NOTICE '[VALIDATE] ✓ Trigger on_super_admin_auto_assign is active.';
  ELSE
    RAISE EXCEPTION '[VALIDATE] FAIL — trigger not found. Something went wrong.';
  END IF;

  -- If user still exists, do a quick role sanity check
  SELECT id INTO v_uid
  FROM   auth.users
  WHERE  email = 'i.h.himel@gmail.com'
  LIMIT  1;

  IF v_uid IS NOT NULL THEN
    RAISE NOTICE
      '[INFO] i.h.himel@gmail.com (uid=%) still exists in auth.users. '
      'Delete this user in Supabase Auth → invite again so the trigger fires.',
      v_uid;
  ELSE
    RAISE NOTICE
      '[INFO] i.h.himel@gmail.com is not in auth.users yet. '
      'Invite the user — the trigger will assign super_admin on signup.';
  END IF;

  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Super-admin reset migration complete.';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Supabase Dashboard → Auth → Users';
  RAISE NOTICE '  2. Delete i.h.himel@gmail.com';
  RAISE NOTICE '  3. Invite i.h.himel@gmail.com (or create directly)';
  RAISE NOTICE '  4. Set password via invite email';
  RAISE NOTICE '  5. Log in — "Super Admin" badge should appear';
  RAISE NOTICE '=================================================';
END $$;
