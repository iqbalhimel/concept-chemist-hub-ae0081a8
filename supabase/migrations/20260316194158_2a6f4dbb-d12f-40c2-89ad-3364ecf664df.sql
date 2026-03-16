
-- Step 1: Extend the app_role enum with new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- Add last_login_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
