
-- Clear existing frontend registry and create comprehensive one with correct element_type
DELETE FROM public.frontend_registry WHERE id IS NOT NULL;

-- Insert comprehensive frontend registry organized by pages/modules (using 'field' for all)
INSERT INTO public.frontend_registry (element_key, label, module, screen, element_type, is_active) VALUES

-- Dashboard Module
('dashboard', 'Dashboard Page Access', 'dashboard', 'dashboard', 'field', true),
('dashboard.view_stats', 'View Dashboard Stats', 'dashboard', 'dashboard', 'field', true),
('dashboard.view_charts', 'View Dashboard Charts', 'dashboard', 'dashboard', 'field', true),
('dashboard.quick_actions', 'Dashboard Quick Actions', 'dashboard', 'dashboard', 'field', true),
('dashboard.calendar_view', 'Calendar View Tab', 'dashboard', 'dashboard', 'field', true),
('dashboard.export_data', 'Export Dashboard Data', 'dashboard', 'dashboard', 'field', true),

-- Cases Module - Main Access
('cases', 'Cases Page Access', 'cases', 'cases', 'field', true),

-- Cases Module - List View
('cases.view_cases_list', 'View Cases List', 'cases', 'cases', 'field', true),
('cases.search_cases', 'Search Cases', 'cases', 'cases', 'field', true),
('cases.filter_by_status', 'Filter Cases by Status', 'cases', 'cases', 'field', true),
('cases.filter_by_priority', 'Filter Cases by Priority', 'cases', 'cases', 'field', true),
('cases.export_cases', 'Export Cases', 'cases', 'cases', 'field', true),

-- Cases Module - Actions
('cases.create_case', 'New Case Button', 'cases', 'cases', 'field', true),
('cases.edit_case', 'Edit Case', 'cases', 'cases', 'field', true),
('cases.delete_case', 'Delete Case', 'cases', 'cases', 'field', true),
('cases.view_case_details', 'View Case Details', 'cases', 'cases', 'field', true),

-- Cases Module - Field Level Permissions
('cases.view_case_title', 'View Case Title', 'cases', 'cases', 'field', true),
('cases.edit_case_title', 'Edit Case Title', 'cases', 'cases', 'field', true),
('cases.view_case_description', 'View Case Description', 'cases', 'cases', 'field', true),
('cases.edit_case_description', 'Edit Case Description', 'cases', 'cases', 'field', true),
('cases.view_case_status', 'View Case Status', 'cases', 'cases', 'field', true),
('cases.edit_case_status', 'Edit Case Status', 'cases', 'cases', 'field', true),
('cases.view_case_priority', 'View Case Priority', 'cases', 'cases', 'field', true),
('cases.edit_case_priority', 'Edit Case Priority', 'cases', 'cases', 'field', true),
('cases.view_case_category', 'View Case Category', 'cases', 'cases', 'field', true),
('cases.edit_case_category', 'Edit Case Category', 'cases', 'cases', 'field', true),
('cases.view_case_location', 'View Case Location', 'cases', 'cases', 'field', true),
('cases.edit_case_location', 'Edit Case Location', 'cases', 'cases', 'field', true),
('cases.view_submitted_by', 'View Submitted By', 'cases', 'cases', 'field', true),
('cases.view_assigned_to', 'View Assigned To', 'cases', 'cases', 'field', true),
('cases.assign_case', 'Assign Case to User', 'cases', 'cases', 'field', true),
('cases.view_created_date', 'View Created Date', 'cases', 'cases', 'field', true),
('cases.view_updated_date', 'View Updated Date', 'cases', 'cases', 'field', true),

-- Notifications Module
('notifications', 'Notifications Page Access', 'notifications', 'notifications', 'field', true),
('notifications.view_notifications', 'View Notifications', 'notifications', 'notifications', 'field', true),
('notifications.mark_read', 'Mark Notifications Read', 'notifications', 'notifications', 'field', true),
('notifications.delete_notification', 'Delete Notifications', 'notifications', 'notifications', 'field', true),
('notifications.notification_settings', 'Notification Settings', 'notifications', 'notifications', 'field', true),

-- Reports Module
('reports', 'Reports Page Access', 'reports', 'reports', 'field', true),
('reports.view_reports', 'View Reports List', 'reports', 'reports', 'field', true),
('reports.create_report', 'Create New Report', 'reports', 'reports', 'field', true),
('reports.edit_report', 'Edit Report', 'reports', 'reports', 'field', true),
('reports.delete_report', 'Delete Report', 'reports', 'reports', 'field', true),
('reports.export_report', 'Export Report', 'reports', 'reports', 'field', true),
('reports.run_report', 'Run Report', 'reports', 'reports', 'field', true),

-- Knowledge Base Module
('knowledge', 'Knowledge Base Access', 'knowledge', 'knowledge', 'field', true),
('knowledge.view_articles', 'View Knowledge Articles', 'knowledge', 'knowledge', 'field', true),
('knowledge.create_article', 'Create Knowledge Article', 'knowledge', 'knowledge', 'field', true),
('knowledge.edit_article', 'Edit Knowledge Article', 'knowledge', 'knowledge', 'field', true),
('knowledge.delete_article', 'Delete Knowledge Article', 'knowledge', 'knowledge', 'field', true),
('knowledge.search_articles', 'Search Knowledge Base', 'knowledge', 'knowledge', 'field', true),

-- Insights Module
('insights', 'Insights Page Access', 'insights', 'insights', 'field', true),
('insights.view_analytics', 'View Analytics', 'insights', 'insights', 'field', true),
('insights.create_dashboard', 'Create Custom Dashboard', 'insights', 'insights', 'field', true),
('insights.export_insights', 'Export Insights', 'insights', 'insights', 'field', true),

-- Admin - Users Management
('users_management', 'Users Management Access', 'users_management', 'admin/users', 'field', true),
('users_management.view_users', 'View Users List', 'users_management', 'admin/users', 'field', true),
('users_management.create_user', 'Create New User', 'users_management', 'admin/users', 'field', true),
('users_management.edit_user', 'Edit User Details', 'users_management', 'admin/users', 'field', true),
('users_management.delete_user', 'Delete User', 'users_management', 'admin/users', 'field', true),
('users_management.assign_role', 'Assign User Role', 'users_management', 'admin/users', 'field', true),
('users_management.view_user_activity', 'View User Activity', 'users_management', 'admin/users', 'field', true),

-- Admin - Roles Management
('roles_management', 'Roles Management Access', 'roles_management', 'admin/roles', 'field', true),
('roles_management.view_roles', 'View Roles List', 'roles_management', 'admin/roles', 'field', true),
('roles_management.create_role', 'Create New Role', 'roles_management', 'admin/roles', 'field', true),
('roles_management.edit_role', 'Edit Role Details', 'roles_management', 'admin/roles', 'field', true),
('roles_management.delete_role', 'Delete Role', 'roles_management', 'admin/roles', 'field', true),

-- Admin - Permissions Management
('permissions_management', 'Permissions Management Access', 'permissions_management', 'admin/permissions', 'field', true),
('permissions_management.view_permissions', 'View Permissions Matrix', 'permissions_management', 'admin/permissions', 'field', true),
('permissions_management.edit_permissions', 'Edit Role Permissions', 'permissions_management', 'admin/permissions', 'field', true),
('permissions_management.bulk_permissions', 'Bulk Permission Changes', 'permissions_management', 'admin/permissions', 'field', true);

-- Verify the count
SELECT COUNT(*) as total_elements, 
       COUNT(DISTINCT module) as total_modules 
FROM public.frontend_registry;
