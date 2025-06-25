
-- Populate frontend_registry with all the main application features
INSERT INTO public.frontend_registry (element_key, module, screen, element_type, label, is_active) VALUES
-- Dashboard module
('dashboard', 'dashboard', 'main', 'page', 'Dashboard', true),

-- Cases module
('cases', 'cases', 'main', 'page', 'Cases', true),
('cases.create_case', 'cases', 'main', 'button', 'Create Case', true),
('cases.edit_case', 'cases', 'main', 'button', 'Edit Case', true),
('cases.delete_case', 'cases', 'main', 'button', 'Delete Case', true),
('cases.assign_case', 'cases', 'main', 'button', 'Assign Case', true),
('cases.view_details', 'cases', 'main', 'field', 'View Case Details', true),

-- Notifications module
('notifications', 'notifications', 'main', 'page', 'Notifications', true),
('notifications.mark_read', 'notifications', 'main', 'button', 'Mark as Read', true),

-- Reports module
('reports', 'reports', 'main', 'page', 'Reports', true),
('reports.create_report', 'reports', 'main', 'button', 'Create Report', true),
('reports.edit_report', 'reports', 'main', 'button', 'Edit Report', true),
('reports.delete_report', 'reports', 'main', 'button', 'Delete Report', true),

-- Knowledge Base module
('knowledge', 'knowledge', 'main', 'page', 'Knowledge Base', true),

-- Insights module
('insights', 'insights', 'main', 'page', 'Insights', true),

-- Admin modules (should be restricted)
('users_management', 'users_management', 'main', 'page', 'User Management', true),
('permissions_management', 'permissions_management', 'main', 'page', 'Permissions Management', true),
('roles_management', 'roles_management', 'main', 'page', 'Roles Management', true)

ON CONFLICT (element_key) DO UPDATE SET
  module = EXCLUDED.module,
  screen = EXCLUDED.screen,
  element_type = EXCLUDED.element_type,
  label = EXCLUDED.label,
  is_active = EXCLUDED.is_active;

-- Clear existing permissions to ensure clean sync
DELETE FROM public.permissions WHERE role_id IN (
  SELECT id FROM public.roles WHERE name IN ('caseworker', 'case_worker')
);

-- Now set up permissions for case worker role
-- First, get the case worker role ID (create if doesn't exist)
DO $$
DECLARE
  caseworker_role_id UUID;
  registry_record RECORD;
BEGIN
  -- Get or create caseworker role (try both variations)
  SELECT id INTO caseworker_role_id FROM public.roles WHERE name IN ('caseworker', 'case_worker') LIMIT 1;
  
  IF caseworker_role_id IS NULL THEN
    INSERT INTO public.roles (name, description, role_type, is_system)
    VALUES ('caseworker', 'Case Worker - can manage cases and view reports', 'internal', false)
    RETURNING id INTO caseworker_role_id;
  END IF;

  -- Grant permissions for case workers to core functionality
  FOR registry_record IN 
    SELECT id, element_key FROM public.frontend_registry 
    WHERE element_key IN (
      'dashboard',
      'cases',
      'cases.create_case',
      'cases.edit_case',
      'cases.assign_case',
      'cases.view_details',
      'notifications',
      'notifications.mark_read',
      'reports',
      'reports.create_report',
      'knowledge',
      'insights'
    )
  LOOP
    INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_record.id, true, true)
    ON CONFLICT (role_id, frontend_registry_id) 
    DO UPDATE SET can_view = true, can_edit = true;
  END LOOP;

  -- Grant view-only permissions for some reports features
  FOR registry_record IN 
    SELECT id, element_key FROM public.frontend_registry 
    WHERE element_key IN ('reports.edit_report', 'reports.delete_report')
  LOOP
    INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_record.id, true, false)
    ON CONFLICT (role_id, frontend_registry_id) 
    DO UPDATE SET can_view = true, can_edit = false;
  END LOOP;

  -- Explicitly deny access to admin features
  FOR registry_record IN 
    SELECT id, element_key FROM public.frontend_registry 
    WHERE element_key IN (
      'users_management',
      'permissions_management', 
      'roles_management'
    )
  LOOP
    INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_record.id, false, false)
    ON CONFLICT (role_id, frontend_registry_id) 
    DO UPDATE SET can_view = false, can_edit = false;
  END LOOP;

  RAISE NOTICE 'Caseworker permissions setup completed for role ID: %', caseworker_role_id;
END $$;

-- Also set up permissions for admin roles to have full access
DO $$
DECLARE
  admin_role_id UUID;
  super_admin_role_id UUID;
  registry_record RECORD;
BEGIN
  -- Get admin roles
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
  SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';

  -- Grant full permissions to admin roles for all features
  FOR registry_record IN SELECT id FROM public.frontend_registry WHERE is_active = true
  LOOP
    IF admin_role_id IS NOT NULL THEN
      INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
      VALUES (admin_role_id, registry_record.id, true, true)
      ON CONFLICT (role_id, frontend_registry_id) 
      DO UPDATE SET can_view = true, can_edit = true;
    END IF;

    IF super_admin_role_id IS NOT NULL THEN
      INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
      VALUES (super_admin_role_id, registry_record.id, true, true)
      ON CONFLICT (role_id, frontend_registry_id) 
      DO UPDATE SET can_view = true, can_edit = true;
    END IF;
  END LOOP;
END $$;
