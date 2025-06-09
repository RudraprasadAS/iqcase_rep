
-- Remove ALL RLS policies from ALL tables to start fresh
DROP POLICY IF EXISTS "cases_select_policy" ON cases;
DROP POLICY IF EXISTS "cases_insert_policy" ON cases;
DROP POLICY IF EXISTS "cases_update_policy" ON cases;
DROP POLICY IF EXISTS "cases_delete_policy" ON cases;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
DROP POLICY IF EXISTS "admins_can_view_all_users" ON users;
DROP POLICY IF EXISTS "admins_can_insert_users" ON users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON users;
DROP POLICY IF EXISTS "admins_can_update_users" ON users;
DROP POLICY IF EXISTS "admins_can_delete_users" ON users;
DROP POLICY IF EXISTS "authenticated_users_can_view_roles" ON roles;
DROP POLICY IF EXISTS "admins_can_manage_roles" ON roles;
DROP POLICY IF EXISTS "authenticated_users_can_view_categories" ON case_categories;
DROP POLICY IF EXISTS "admins_can_manage_categories" ON case_categories;
DROP POLICY IF EXISTS "admins_can_manage_permissions" ON permissions;
DROP POLICY IF EXISTS "users_can_view_own_role_permissions" ON permissions;
DROP POLICY IF EXISTS "messages_case_access" ON case_messages;
DROP POLICY IF EXISTS "tasks_access" ON case_tasks;
DROP POLICY IF EXISTS "watchers_access" ON case_watchers;
DROP POLICY IF EXISTS "attachments_case_access" ON case_attachments;
DROP POLICY IF EXISTS "notes_case_access" ON case_notes;
DROP POLICY IF EXISTS "feedback_case_access" ON case_feedback;

-- Disable RLS on ALL tables to allow everything to work
ALTER TABLE cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_watchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE case_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_templates DISABLE ROW LEVEL SECURITY;
