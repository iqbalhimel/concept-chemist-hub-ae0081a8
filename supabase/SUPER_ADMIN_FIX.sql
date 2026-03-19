-- ============================================================
-- RUN THIS DIRECTLY IN SUPABASE SQL EDITOR
-- Super-admin fix for i.h.himel@gmail.com
-- ============================================================

-- STEP 1: Fix get_admin_role() with deterministic ORDER BY
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

-- STEP 2: Fix site_settings UPDATE policy (adds WITH CHECK)
DROP POLICY IF EXISTS "Admins can update site_settings" ON public.site_settings;
CREATE POLICY "Admins can update site_settings"
  ON public.site_settings FOR UPDATE TO authenticated
  USING  (public.is_any_admin(auth.uid()))
  WITH CHECK (public.is_any_admin(auth.uid()));

-- STEP 3: Create auto-assign trigger function
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

    -- Create baseline profile
    INSERT INTO public.profiles (user_id, name, created_at, updated_at)
    VALUES (NEW.id, 'Super Admin', now(), now())
    ON CONFLICT (user_id) DO UPDATE
      SET name       = EXCLUDED.name,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- STEP 4: Attach trigger to auth.users
DROP TRIGGER IF EXISTS on_super_admin_auto_assign ON auth.users;
CREATE TRIGGER on_super_admin_auto_assign
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_super_admin_auto_assign();

-- Done! Now follow manual steps below.
