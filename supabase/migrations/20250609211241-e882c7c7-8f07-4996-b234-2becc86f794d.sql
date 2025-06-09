
-- First, let's check what element types are allowed by looking at the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'frontend_registry'::regclass 
AND conname LIKE '%element_type%';

-- Clear any existing entries first
DELETE FROM public.frontend_registry WHERE id IS NOT NULL;

-- Insert comprehensive frontend registry entries using 'field' as element type for all
INSERT INTO public.frontend_registry (element_key, label, module, screen, element_type, is_active) VALUES
-- Dashboard module
('dashboard', 'Dashboard', 'dashboard', 'dashboard', 'field', true),
('dashboard.view_dashboard', 'View Dashboard', 'dashboard', 'dashboard', 'field', true),
('dashboard.export_dashboard', 'Export Dashboard', 'dashboard', 'dashboard', 'field', true),
('dashboard.customize_dashboard', 'Customize Dashboard', 'dashboard', 'dashboard', 'field', true),
('dashboard.view_dashboard_metrics', 'View Dashboard Metrics', 'dashboard', 'dashboard', 'field', true),
('dashboard.edit_dashboard_layout', 'Edit Dashboard Layout', 'dashboard', 'dashboard', 'field', true),
('dashboard.create_dashboard_widgets', 'Create Dashboard Widgets', 'dashboard', 'dashboard', 'field', true),

-- Cases module
('cases', 'Cases', 'cases', 'cases', 'field', true),
('cases.view_cases', 'View Cases', 'cases', 'cases', 'field', true),
('cases.create_case', 'Create Case', 'cases', 'cases', 'field', true),
('cases.edit_case', 'Edit Case', 'cases', 'cases', 'field', true),
('cases.delete_case', 'Delete Case', 'cases', 'cases', 'field', true),
('cases.assign_case', 'Assign Case', 'cases', 'cases', 'field', true),
('cases.export_cases', 'Export Cases', 'cases', 'cases', 'field', true),
('cases.view_case_details', 'View Case Details', 'cases', 'cases', 'field', true),
('cases.edit_case_title', 'Edit Case Title', 'cases', 'cases', 'field', true),
('cases.edit_case_description', 'Edit Case Description', 'cases', 'cases', 'field', true),
('cases.edit_case_status', 'Edit Case Status', 'cases', 'cases', 'field', true),
('cases.edit_case_priority', 'Edit Case Priority', 'cases', 'cases', 'field', true),
('cases.edit_case_category', 'Edit Case Category', 'cases', 'cases', 'field', true),
('cases.edit_case_location', 'Edit Case Location', 'cases', 'cases', 'field', true),
('cases.edit_case_tags', 'Edit Case Tags', 'cases', 'cases', 'field', true),
('cases.close_case', 'Close Case', 'cases', 'cases', 'field', true),
('cases.reopen_case', 'Reopen Case', 'cases', 'cases', 'field', true),
('cases.archive_case', 'Archive Case', 'cases', 'cases', 'field', true),

-- Case Tasks module
('case_tasks', 'Case Tasks', 'case_tasks', 'case_tasks', 'field', true),
('case_tasks.view_case_tasks', 'View Case Tasks', 'case_tasks', 'case_tasks', 'field', true),
('case_tasks.create_case_task', 'Create Case Task', 'case_tasks', 'case_tasks', 'field', true),
('case_tasks.edit_case_task', 'Edit Case Task', 'case_tasks', 'case_tasks', 'field', true),
('case_tasks.delete_case_task', 'Delete Case Task', 'case_tasks', 'case_tasks', 'field', true),
('case_tasks.assign_case_task', 'Assign Case Task', 'case_tasks', 'case_tasks', 'field', true),
('case_tasks.complete_case_task', 'Complete Case Task', 'case_tasks', 'case_tasks', 'field', true),
('case_tasks.set_task_due_date', 'Set Task Due Date', 'case_tasks', 'case_tasks', 'field', true),
('case_tasks.view_task_history', 'View Task History', 'case_tasks', 'case_tasks', 'field', true),

-- Case Notes module
('case_notes', 'Case Notes', 'case_notes', 'case_notes', 'field', true),
('case_notes.view_case_notes', 'View Case Notes', 'case_notes', 'case_notes', 'field', true),
('case_notes.add_case_note', 'Add Case Note', 'case_notes', 'case_notes', 'field', true),
('case_notes.edit_case_note', 'Edit Case Note', 'case_notes', 'case_notes', 'field', true),
('case_notes.delete_case_note', 'Delete Case Note', 'case_notes', 'case_notes', 'field', true),
('case_notes.pin_case_note', 'Pin Case Note', 'case_notes', 'case_notes', 'field', true),
('case_notes.view_internal_notes', 'View Internal Notes', 'case_notes', 'case_notes', 'field', true),
('case_notes.create_internal_notes', 'Create Internal Notes', 'case_notes', 'case_notes', 'field', true),

-- Case Messages module
('case_messages', 'Case Messages', 'case_messages', 'case_messages', 'field', true),
('case_messages.view_case_messages', 'View Case Messages', 'case_messages', 'case_messages', 'field', true),
('case_messages.send_internal_message', 'Send Internal Message', 'case_messages', 'case_messages', 'field', true),
('case_messages.send_external_message', 'Send External Message', 'case_messages', 'case_messages', 'field', true),
('case_messages.edit_message', 'Edit Message', 'case_messages', 'case_messages', 'field', true),
('case_messages.delete_message', 'Delete Message', 'case_messages', 'case_messages', 'field', true),
('case_messages.pin_message', 'Pin Message', 'case_messages', 'case_messages', 'field', true),
('case_messages.view_message_history', 'View Message History', 'case_messages', 'case_messages', 'field', true),

-- Notifications module
('notifications', 'Notifications', 'notifications', 'notifications', 'field', true),
('notifications.view_notifications', 'View Notifications', 'notifications', 'notifications', 'field', true),
('notifications.mark_notification_read', 'Mark Notification Read', 'notifications', 'notifications', 'field', true),
('notifications.delete_notification', 'Delete Notification', 'notifications', 'notifications', 'field', true),
('notifications.create_notification', 'Create Notification', 'notifications', 'notifications', 'field', true),
('notifications.send_bulk_notifications', 'Send Bulk Notifications', 'notifications', 'notifications', 'field', true),
('notifications.configure_notification_settings', 'Configure Notification Settings', 'notifications', 'notifications', 'field', true),

-- Users Management module
('users_management', 'Users Management', 'users_management', 'users_management', 'field', true),
('users_management.view_users', 'View Users', 'users_management', 'users_management', 'field', true),
('users_management.create_user', 'Create User', 'users_management', 'users_management', 'field', true),
('users_management.edit_user', 'Edit User', 'users_management', 'users_management', 'field', true),
('users_management.delete_user', 'Delete User', 'users_management', 'users_management', 'field', true),
('users_management.activate_user', 'Activate User', 'users_management', 'users_management', 'field', true),
('users_management.deactivate_user', 'Deactivate User', 'users_management', 'users_management', 'field', true),
('users_management.reset_user_password', 'Reset User Password', 'users_management', 'users_management', 'field', true),
('users_management.manage_user_roles', 'Manage User Roles', 'users_management', 'users_management', 'field', true),
('users_management.view_user_activity', 'View User Activity', 'users_management', 'users_management', 'field', true),

-- Roles & Permissions module
('roles_and_permissions', 'Roles & Permissions', 'roles_and_permissions', 'roles_and_permissions', 'field', true),
('roles_and_permissions.view_permissions', 'View Permissions', 'roles_and_permissions', 'roles_and_permissions', 'field', true),
('roles_and_permissions.edit_permissions', 'Edit Permissions', 'roles_and_permissions', 'roles_and_permissions', 'field', true),
('roles_and_permissions.create_roles', 'Create Roles', 'roles_and_permissions', 'roles_and_permissions', 'field', true),
('roles_and_permissions.delete_roles', 'Delete Roles', 'roles_and_permissions', 'roles_and_permissions', 'field', true),
('roles_and_permissions.edit_roles', 'Edit Roles', 'roles_and_permissions', 'roles_and_permissions', 'field', true),
('roles_and_permissions.assign_permissions', 'Assign Permissions', 'roles_and_permissions', 'roles_and_permissions', 'field', true),
('roles_and_permissions.view_role_hierarchy', 'View Role Hierarchy', 'roles_and_permissions', 'roles_and_permissions', 'field', true),

-- Reports module
('reports', 'Reports', 'reports', 'reports', 'field', true),
('reports.view_reports', 'View Reports', 'reports', 'reports', 'field', true),
('reports.create_reports', 'Create Reports', 'reports', 'reports', 'field', true),
('reports.edit_reports', 'Edit Reports', 'reports', 'reports', 'field', true),
('reports.delete_reports', 'Delete Reports', 'reports', 'reports', 'field', true),
('reports.export_reports', 'Export Reports', 'reports', 'reports', 'field', true),
('reports.schedule_reports', 'Schedule Reports', 'reports', 'reports', 'field', true),
('reports.share_reports', 'Share Reports', 'reports', 'reports', 'field', true),
('reports.view_report_analytics', 'View Report Analytics', 'reports', 'reports', 'field', true);
