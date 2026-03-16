
-- Function to check if user has any admin-level role
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
      AND role IN ('admin', 'super_admin', 'editor', 'moderator')
  )
$$;

-- Function to get user's admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = _user_id
    AND role IN ('admin', 'super_admin', 'editor', 'moderator')
  LIMIT 1
$$;

-- Allow any admin to read all profiles (for admin management)
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_any_admin(auth.uid()));

-- Allow super_admin/admin to insert profiles for other users
CREATE POLICY "Super admins can insert any profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  );

-- Allow super_admin/admin to update any profile
CREATE POLICY "Super admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin')
  );

-- Allow super_admin/admin to manage user_roles
CREATE POLICY "Super admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
