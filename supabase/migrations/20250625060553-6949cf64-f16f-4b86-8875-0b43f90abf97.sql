
-- First, add a unique constraint to frontend_registry.element_key
ALTER TABLE public.frontend_registry ADD CONSTRAINT frontend_registry_element_key_unique UNIQUE (element_key);

-- Now insert the frontend registry entries (using DO NOTHING for conflicts)
INSERT INTO public.frontend_registry (element_key, module, screen, element_type, label, is_active) VALUES
-- Core pages that should be accessible
('dashboard', 'dashboard', 'main', 'page', 'Dashboard', true),
('cases', 'cases', 'main', 'page', 'Cases', true),
('notifications', 'notifications', 'main', 'page', 'Notifications', true),
('reports', 'reports', 'main', 'page', 'Reports', true),
('knowledge', 'knowledge', 'main', 'page', 'Knowledge Base', true),
('insights', 'insights', 'main', 'page', 'Insights', true),

-- Admin pages that should be restricted
('users_management', 'users_management', 'admin', 'page', 'User Management', true),
('permissions_management', 'permissions_management', 'admin', 'page', 'Permissions Management', true),
('roles_management', 'roles_management', 'admin', 'page', 'Roles Management', true),

-- Cases sub-features
('cases.create_case', 'cases', 'main', 'button', 'Create Case', true),
('cases.edit_case', 'cases', 'main', 'button', 'Edit Case', true),
('cases.delete_case', 'cases', 'main', 'button', 'Delete Case', true),
('cases.assign_case', 'cases', 'main', 'button', 'Assign Case', true),
('cases.view_details', 'cases', 'main', 'field', 'View Case Details', true),

-- Notifications sub-features
('notifications.mark_read', 'notifications', 'main', 'button', 'Mark as Read', true),

-- Reports sub-features
('reports.create_report', 'reports', 'main', 'button', 'Create Report', true),
('reports.edit_report', 'reports', 'main', 'button', 'Edit Report', true),
('reports.delete_report', 'reports', 'main', 'button', 'Delete Report', true)
ON CONFLICT (element_key) DO NOTHING;

-- Clean up ALL existing permissions to start fresh
DELETE FROM public.permissions;

-- Now set up permissions properly
DO $$
DECLARE
  caseworker_role_id UUID;
  admin_role_id UUID;
  super_admin_role_id UUID;
  registry_record RECORD;
BEGIN
  -- Get role IDs
  SELECT id INTO caseworker_role_id FROM public.roles WHERE name IN ('caseworker', 'case_worker') LIMIT 1;
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin' LIMIT 1;
  SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin' LIMIT 1;

  -- Debug output
  RAISE NOTICE 'Found caseworker role ID: %', caseworker_role_id;
  RAISE NOTICE 'Found admin role ID: %', admin_role_id;
  RAISE NOTICE 'Found super_admin role ID: %', super_admin_role_id;

  -- If caseworker role doesn't exist, create it
  IF caseworker_role_id IS NULL THEN
    INSERT INTO public.roles (name, description, role_type, is_system)
    VALUES ('caseworker', 'Case Worker - can manage cases and view reports', 'internal', false)
    RETURNING id INTO caseworker_role_id;
    RAISE NOTICE 'Created new caseworker role with ID: %', caseworker_role_id;
  END IF;

  -- Grant permissions for caseworkers to core functionality
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
    VALUES (caseworker_role_id, registry_record.id, true, true);
    RAISE NOTICE 'Added permission for caseworker: %', registry_record.element_key;
  END LOOP;

  -- Grant view-only permissions for some reports features
  FOR registry_record IN 
    SELECT id, element_key FROM public.frontend_registry 
    WHERE element_key IN ('reports.edit_report', 'reports.delete_report')
  LOOP
    INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_record.id, true, false);
    RAISE NOTICE 'Added view-only permission for caseworker: %', registry_record.element_key;
  END LOOP;

  -- Explicitly deny access to admin features for caseworkers
  FOR registry_record IN 
    SELECT id, element_key FROM public.frontend_registry 
    WHERE element_key IN (
      'users_management',
      'permissions_management', 
      'roles_management'
    )
  LOOP
    INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_record.id, false, false);
    RAISE NOTICE 'Denied admin permission for caseworker: %', registry_record.element_key;
  END LOOP;

  -- Grant full permissions to admin roles for all features
  FOR registry_record IN SELECT id, element_key FROM public.frontend_registry WHERE is_active = true
  LOOP
    IF admin_role_id IS NOT NULL THEN
      INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
      VALUES (admin_role_id, registry_record.id, true, true);
    END IF;

    IF super_admin_role_id IS NOT NULL THEN
      INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
      VALUES (super_admin_role_id, registry_record.id, true, true);
    END IF;
  END LOOP;

  RAISE NOTICE 'Permission setup completed successfully';
END $$;

-- Verify the setup with some debug queries
DO $$
DECLARE
  role_count INTEGER;
  permission_count INTEGER;
  caseworker_permission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM public.roles;
  SELECT COUNT(*) INTO permission_count FROM public.permissions;
  SELECT COUNT(*) INTO caseworker_permission_count 
  FROM public.permissions p
  JOIN public.roles r ON p.role_id = r.id
  WHERE r.name IN ('caseworker', 'case_worker');
  
  RAISE NOTICE 'Total roles: %, Total permissions: %, Caseworker permissions: %', 
    role_count, permission_count, caseworker_permission_count;
END $$;
