
-- Fix RLS policies to allow proper access for admin users

-- First, let's check if we have the basic policies for viewing data
-- Allow authenticated users to view roles (needed for dropdowns and role management)
DROP POLICY IF EXISTS "authenticated_users_can_view_roles" ON roles;
CREATE POLICY "authenticated_users_can_view_roles" ON roles
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to view categories (needed for case creation)
DROP POLICY IF EXISTS "authenticated_users_can_view_categories" ON case_categories;
CREATE POLICY "authenticated_users_can_view_categories" ON case_categories
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow users to view their own profile and admins to view all
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
CREATE POLICY "users_can_view_own_profile" ON users
FOR SELECT 
USING (
  auth_user_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Allow users to view permissions for their role and admins to view all
DROP POLICY IF EXISTS "users_can_view_own_role_permissions" ON permissions;
CREATE POLICY "users_can_view_own_role_permissions" ON permissions
FOR SELECT
USING (
  role_id IN (
    SELECT u.role_id FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Enable RLS on reports table if not already enabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own reports and public reports
CREATE POLICY "users_can_view_accessible_reports" ON reports
FOR SELECT
USING (
  created_by IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
  OR is_public = true
  OR EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Allow users to manage their own reports and admins to manage all
CREATE POLICY "users_can_manage_own_reports" ON reports
FOR ALL
USING (
  created_by IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Enable RLS on cases table if not already enabled (it should be from previous migration)
-- Allow users to view cases they're involved with or all cases for admins
DROP POLICY IF EXISTS "case_contextual_access" ON cases;
CREATE POLICY "case_contextual_access" ON cases
FOR SELECT USING (
  -- User is assigned to the case
  assigned_to IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
  -- User submitted the case
  OR submitted_by IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
  -- User is a watcher
  OR id IN (
    SELECT case_id FROM case_watchers cw
    JOIN users u ON cw.user_id = u.id
    WHERE u.auth_user_id = auth.uid()
  )
  -- User has tasks on the case
  OR id IN (
    SELECT case_id FROM case_tasks ct
    JOIN users u ON ct.assigned_to = u.id
    WHERE u.auth_user_id = auth.uid()
  )
  -- User is admin or super_admin
  OR EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Allow admins to manage all cases
CREATE POLICY "admins_can_manage_all_cases" ON cases
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);

-- Enable RLS on notifications if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own notifications
CREATE POLICY "users_can_view_own_notifications" ON notifications
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- Allow users to manage their own notifications
CREATE POLICY "users_can_manage_own_notifications" ON notifications
FOR ALL
USING (
  user_id IN (
    SELECT id FROM users WHERE auth_user_id = auth.uid()
  )
);
