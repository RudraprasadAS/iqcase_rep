
-- Fix infinite recursion in RLS policies by creating security definer functions
-- This migration handles existing policies properly

-- First, create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT r.name 
  FROM users u 
  JOIN roles r ON u.role_id = r.id 
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_internal_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT u.id
  FROM users u 
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- Drop ALL existing policies that might cause conflicts
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
DROP POLICY IF EXISTS "users_can_view_profiles" ON users;
DROP POLICY IF EXISTS "admins_can_manage_users" ON users;
DROP POLICY IF EXISTS "admins_can_manage_all_users" ON users;

DROP POLICY IF EXISTS "users_can_view_own_role_permissions" ON permissions;
DROP POLICY IF EXISTS "users_can_view_permissions" ON permissions;
DROP POLICY IF EXISTS "admins_can_manage_permissions" ON permissions;
DROP POLICY IF EXISTS "admins_can_manage_all_permissions" ON permissions;

DROP POLICY IF EXISTS "case_contextual_access" ON cases;
DROP POLICY IF EXISTS "users_can_view_cases" ON cases;
DROP POLICY IF EXISTS "admins_can_manage_all_cases" ON cases;
DROP POLICY IF EXISTS "admins_can_manage_cases" ON cases;
DROP POLICY IF EXISTS "users_can_create_cases" ON cases;

DROP POLICY IF EXISTS "users_can_view_accessible_reports" ON reports;
DROP POLICY IF EXISTS "users_can_manage_own_reports" ON reports;
DROP POLICY IF EXISTS "users_can_view_reports" ON reports;
DROP POLICY IF EXISTS "users_can_manage_reports" ON reports;

DROP POLICY IF EXISTS "users_can_view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_manage_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_view_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_manage_notifications" ON notifications;

DROP POLICY IF EXISTS "authenticated_users_can_view_categories" ON case_categories;
DROP POLICY IF EXISTS "all_users_can_view_categories" ON case_categories;
DROP POLICY IF EXISTS "admins_can_manage_categories" ON case_categories;

DROP POLICY IF EXISTS "authenticated_users_can_view_roles" ON roles;
DROP POLICY IF EXISTS "all_users_can_view_roles" ON roles;
DROP POLICY IF EXISTS "admins_can_manage_roles" ON roles;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create new policies using security definer functions (no recursion)

-- Users table policies
CREATE POLICY "users_can_view_profiles" ON users
FOR SELECT 
USING (
  auth_user_id = auth.uid() 
  OR public.is_admin_user()
);

CREATE POLICY "admins_can_manage_all_users" ON users
FOR ALL
USING (public.is_admin_user());

-- Permissions table policies
CREATE POLICY "users_can_view_permissions" ON permissions
FOR SELECT
USING (
  role_id IN (
    SELECT u.role_id FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
  OR public.is_admin_user()
);

CREATE POLICY "admins_can_manage_all_permissions" ON permissions
FOR ALL
USING (public.is_admin_user());

-- Cases table policies
CREATE POLICY "users_can_view_cases" ON cases
FOR SELECT USING (
  public.is_admin_user()
  OR assigned_to = public.get_current_internal_user_id()
  OR submitted_by = public.get_current_internal_user_id()
  OR id IN (
    SELECT case_id FROM case_watchers cw
    WHERE cw.user_id = public.get_current_internal_user_id()
  )
  OR id IN (
    SELECT case_id FROM case_tasks ct
    WHERE ct.assigned_to = public.get_current_internal_user_id()
  )
);

CREATE POLICY "admins_can_manage_cases" ON cases
FOR ALL
USING (public.is_admin_user());

CREATE POLICY "users_can_create_cases" ON cases
FOR INSERT
WITH CHECK (
  submitted_by = public.get_current_internal_user_id()
  OR public.is_admin_user()
);

-- Reports table policies
CREATE POLICY "users_can_view_reports" ON reports
FOR SELECT
USING (
  created_by = public.get_current_internal_user_id()
  OR is_public = true
  OR public.is_admin_user()
);

CREATE POLICY "users_can_manage_reports" ON reports
FOR ALL
USING (
  created_by = public.get_current_internal_user_id()
  OR public.is_admin_user()
);

-- Notifications table policies
CREATE POLICY "users_can_view_notifications" ON notifications
FOR SELECT
USING (
  user_id = public.get_current_internal_user_id()
  OR public.is_admin_user()
);

CREATE POLICY "users_can_manage_notifications" ON notifications
FOR ALL
USING (
  user_id = public.get_current_internal_user_id()
  OR public.is_admin_user()
);

-- Categories table policies (accessible to all authenticated users)
CREATE POLICY "all_users_can_view_categories" ON case_categories
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "admins_can_manage_categories" ON case_categories
FOR ALL
USING (public.is_admin_user());

-- Roles table policies (accessible to all authenticated users)
CREATE POLICY "all_users_can_view_roles" ON roles
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "admins_can_manage_roles" ON roles
FOR ALL
USING (public.is_admin_user());
