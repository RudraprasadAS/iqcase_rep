
-- Clean slate: Remove all existing data but keep table structure
TRUNCATE TABLE case_activities CASCADE;
TRUNCATE TABLE case_attachments CASCADE;
TRUNCATE TABLE case_audit_log CASCADE;
TRUNCATE TABLE case_export_log CASCADE;
TRUNCATE TABLE case_feedback CASCADE;
TRUNCATE TABLE case_messages CASCADE;
TRUNCATE TABLE case_notes CASCADE;
TRUNCATE TABLE case_tasks CASCADE;
TRUNCATE TABLE case_watchers CASCADE;
TRUNCATE TABLE cases CASCADE;
TRUNCATE TABLE related_cases CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE permissions CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE roles CASCADE;
TRUNCATE TABLE case_categories CASCADE;
TRUNCATE TABLE dashboard_layouts CASCADE;
TRUNCATE TABLE dashboard_templates CASCADE;
TRUNCATE TABLE report_configs CASCADE;
TRUNCATE TABLE report_templates CASCADE;
TRUNCATE TABLE reports CASCADE;
TRUNCATE TABLE user_audit_log CASCADE;
TRUNCATE TABLE case_access_log CASCADE;

-- Create fresh roles with proper hierarchy
INSERT INTO roles (name, description, is_system, role_type) VALUES
('super_admin', 'Super Administrator - Full system access', true, 'internal'),
('admin', 'Administrator - Full system access', true, 'internal'),
('manager', 'Manager - Can view and manage all cases', true, 'internal'),
('caseworker', 'Case Worker - Can manage assigned cases', true, 'internal'),
('viewer', 'Viewer - Read-only access to assigned cases', true, 'internal'),
('citizen', 'Citizen - Can submit and view own cases', true, 'external');

-- Create super admin user for development (you can change the email/name)
INSERT INTO users (
  email, 
  name, 
  role_id, 
  user_type, 
  is_active,
  auth_user_id
) VALUES (
  'superadmin@dev.local',
  'Super Admin (Dev)',
  (SELECT id FROM roles WHERE name = 'super_admin'),
  'internal',
  true,
  NULL -- Will be updated when you create the auth user
);

-- Create some basic case categories
INSERT INTO case_categories (name, description, is_active) VALUES
('General Inquiry', 'General questions and requests', true),
('Technical Support', 'Technical issues and support requests', true),
('Billing', 'Billing and payment related issues', true),
('Account Management', 'Account access and management requests', true),
('Bug Report', 'Software bugs and issues', true),
('Feature Request', 'New feature suggestions', true);

-- Grant comprehensive permissions to super_admin and admin roles
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit) 
SELECT r.id, module, field, true, true
FROM roles r,
(VALUES 
  ('users', NULL),
  ('roles', NULL),
  ('permissions', NULL),
  ('cases', NULL),
  ('cases', 'status'),
  ('cases', 'priority'),
  ('cases', 'assigned_to'),
  ('cases', 'internal_notes'),
  ('case_categories', NULL),
  ('case_tasks', NULL),
  ('case_notes', NULL),
  ('case_messages', NULL),
  ('case_attachments', NULL),
  ('case_watchers', NULL),
  ('notifications', NULL),
  ('reports', NULL),
  ('dashboard', NULL)
) AS modules(module, field)
WHERE r.name IN ('super_admin', 'admin');

-- Grant manager permissions (full access except user management)
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit)
SELECT r.id, module, field, true, 
  CASE 
    WHEN module = 'users' AND field IS NULL THEN false
    WHEN module = 'roles' THEN false
    WHEN module = 'permissions' THEN false
    ELSE true 
  END
FROM roles r,
(VALUES 
  ('users', NULL),
  ('cases', NULL),
  ('cases', 'status'),
  ('cases', 'priority'),
  ('cases', 'assigned_to'),
  ('case_categories', NULL),
  ('case_tasks', NULL),
  ('case_notes', NULL),
  ('case_messages', NULL),
  ('case_attachments', NULL),
  ('case_watchers', NULL),
  ('notifications', NULL),
  ('reports', NULL),
  ('dashboard', NULL)
) AS modules(module, field)
WHERE r.name = 'manager';

-- Grant caseworker permissions (limited access)
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit)
SELECT r.id, module, field, true,
  CASE 
    WHEN module = 'users' THEN false
    WHEN field IN ('assigned_to', 'priority') THEN false
    ELSE true 
  END
FROM roles r,
(VALUES 
  ('cases', NULL),
  ('cases', 'status'),
  ('cases', 'priority'),
  ('cases', 'assigned_to'),
  ('case_tasks', NULL),
  ('case_notes', NULL),
  ('case_messages', NULL),
  ('case_attachments', NULL),
  ('notifications', NULL),
  ('dashboard', NULL)
) AS modules(module, field)
WHERE r.name = 'caseworker';

-- Grant viewer permissions (read-only)
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit)
SELECT r.id, module, field, true, false
FROM roles r,
(VALUES 
  ('cases', NULL),
  ('cases', 'status'),
  ('cases', 'priority'),
  ('case_tasks', NULL),
  ('case_messages', NULL),
  ('notifications', NULL),
  ('dashboard', NULL)
) AS modules(module, field)
WHERE r.name = 'viewer';

-- Grant citizen permissions (very limited)
INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit)
SELECT r.id, module, field, true, false
FROM roles r,
(VALUES 
  ('cases', NULL),
  ('case_messages', NULL),
  ('case_attachments', NULL),
  ('notifications', NULL)
) AS modules(module, field)
WHERE r.name = 'citizen';

-- Clean up any existing problematic RLS policies on cases table
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Case access policy" ON cases;
DROP POLICY IF EXISTS "case_contextual_access" ON cases;
DROP POLICY IF EXISTS "case_update_assigned_only" ON cases;
DROP POLICY IF EXISTS "users_can_view_accessible_cases" ON cases;
DROP POLICY IF EXISTS "users_can_edit_cases_with_permission" ON cases;
DROP POLICY IF EXISTS "users_can_insert_cases" ON cases;
DROP POLICY IF EXISTS "simple_case_select_policy" ON cases;
DROP POLICY IF EXISTS "simple_case_insert_policy" ON cases;
DROP POLICY IF EXISTS "simple_case_update_policy" ON cases;
DROP POLICY IF EXISTS "simple_case_delete_policy" ON cases;

-- Drop any problematic functions
DROP FUNCTION IF EXISTS public.get_user_accessible_cases();
DROP FUNCTION IF EXISTS public.can_user_edit_case(uuid);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;

-- Create simple, working RLS policies
CREATE POLICY "cases_select_policy" ON cases
FOR SELECT USING (
  -- Super admins and admins can see everything
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('super_admin', 'admin', 'manager')
  )
  OR
  -- Users can see their own submissions
  submitted_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  OR
  -- Users can see cases assigned to them
  assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "cases_insert_policy" ON cases
FOR INSERT WITH CHECK (
  -- Anyone authenticated can insert, but submitted_by must be themselves
  submitted_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

CREATE POLICY "cases_update_policy" ON cases
FOR UPDATE USING (
  -- Admins can update everything
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('super_admin', 'admin', 'manager', 'caseworker')
  )
);

CREATE POLICY "cases_delete_policy" ON cases
FOR DELETE USING (
  -- Only super admins and admins can delete
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('super_admin', 'admin')
  )
);
