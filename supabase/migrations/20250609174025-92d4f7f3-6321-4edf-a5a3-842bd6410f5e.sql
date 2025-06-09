
-- Fix RLS policies to properly implement role hierarchy and admin access
-- Super Admin > Admin > Manager > Case Worker > Citizen

-- First, update the admin check function to include role hierarchy
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

-- Create function to check if user has manager or higher access
CREATE OR REPLACE FUNCTION public.has_manager_access()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('super_admin', 'admin', 'manager')
  );
$$;

-- Create function to check if user is internal staff
CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u 
    WHERE u.auth_user_id = auth.uid() 
    AND u.user_type = 'internal'
  );
$$;

-- Drop and recreate cases policies with proper hierarchy
DROP POLICY IF EXISTS "users_can_view_cases" ON cases;
DROP POLICY IF EXISTS "admins_can_manage_cases" ON cases;
DROP POLICY IF EXISTS "users_can_create_cases" ON cases;

-- ADMINS AND SUPER_ADMINS SEE ALL CASES
CREATE POLICY "admins_see_all_cases" ON cases
FOR SELECT USING (public.is_admin_user());

-- MANAGERS see all cases but with limited edit rights
CREATE POLICY "managers_see_all_cases" ON cases
FOR SELECT USING (public.has_manager_access());

-- INTERNAL USERS (case workers) see cases they're involved with
CREATE POLICY "internal_users_see_relevant_cases" ON cases
FOR SELECT USING (
  public.is_internal_user() AND (
    assigned_to = public.get_current_internal_user_id()
    OR submitted_by = public.get_current_internal_user_id()
    OR id IN (
      SELECT case_id FROM case_watchers cw
      WHERE cw.user_id = public.get_current_internal_user_id()
    )
    OR id IN (
      SELECT case_id FROM case_tasks ct
      WHERE ct.assigned_to = public.get_current_internal_user_id()
    )
  )
);

-- EXTERNAL USERS (citizens) see only their own cases
CREATE POLICY "citizens_see_own_cases" ON cases
FOR SELECT USING (
  submitted_by = public.get_current_internal_user_id()
);

-- Management policies - hierarchy based
CREATE POLICY "admins_manage_all_cases" ON cases
FOR ALL
USING (public.is_admin_user());

CREATE POLICY "managers_can_edit_cases" ON cases
FOR UPDATE
USING (public.has_manager_access());

CREATE POLICY "internal_users_can_create_cases" ON cases
FOR INSERT
WITH CHECK (
  public.is_internal_user()
  OR public.is_admin_user()
);

CREATE POLICY "citizens_can_create_cases" ON cases
FOR INSERT
WITH CHECK (
  submitted_by = public.get_current_internal_user_id()
);

-- Fix reports table policies for dashboards access
DROP POLICY IF EXISTS "users_can_view_reports" ON reports;
DROP POLICY IF EXISTS "users_can_manage_reports" ON reports;

-- Reports viewing - hierarchy based
CREATE POLICY "admins_see_all_reports" ON reports
FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "managers_see_all_reports" ON reports
FOR SELECT
USING (public.has_manager_access());

CREATE POLICY "internal_users_see_relevant_reports" ON reports
FOR SELECT
USING (
  public.is_internal_user() AND (
    created_by = public.get_current_internal_user_id()
    OR is_public = true
  )
);

CREATE POLICY "citizens_see_public_reports" ON reports
FOR SELECT
USING (is_public = true);

-- Reports management
CREATE POLICY "admins_manage_all_reports" ON reports
FOR ALL
USING (public.is_admin_user());

CREATE POLICY "managers_manage_reports" ON reports
FOR ALL
USING (
  public.has_manager_access() AND (
    created_by = public.get_current_internal_user_id()
    OR public.is_admin_user()
  )
);

CREATE POLICY "internal_users_manage_own_reports" ON reports
FOR ALL
USING (
  public.is_internal_user() AND 
  created_by = public.get_current_internal_user_id()
);

-- Ensure proper permissions for admin modules
DROP POLICY IF EXISTS "users_can_view_permissions" ON permissions;
DROP POLICY IF EXISTS "admins_can_manage_all_permissions" ON permissions;

CREATE POLICY "admins_view_all_permissions" ON permissions
FOR SELECT
USING (public.is_admin_user());

CREATE POLICY "managers_view_permissions" ON permissions
FOR SELECT
USING (
  public.has_manager_access() AND (
    role_id IN (
      SELECT u.role_id FROM users u 
      WHERE u.auth_user_id = auth.uid()
    )
    OR public.is_admin_user()
  )
);

CREATE POLICY "admins_manage_all_permissions" ON permissions
FOR ALL
USING (public.is_admin_user());

-- Make sure notifications work for all internal users
DROP POLICY IF EXISTS "users_can_view_notifications" ON notifications;
DROP POLICY IF EXISTS "users_can_manage_notifications" ON notifications;

CREATE POLICY "users_view_own_notifications" ON notifications
FOR SELECT
USING (
  user_id = public.get_current_internal_user_id()
  OR public.is_admin_user()
);

CREATE POLICY "users_manage_own_notifications" ON notifications
FOR ALL
USING (
  user_id = public.get_current_internal_user_id()
  OR public.is_admin_user()
);
