
-- Fix caseworker permissions - ensure role exists and has proper permissions

-- First, ensure we have a caseworker role (try both variations)
DO $$
DECLARE
  caseworker_role_id UUID;
  registry_record RECORD;
BEGIN
  -- Get caseworker role ID (try both 'caseworker' and 'case_worker')
  SELECT id INTO caseworker_role_id FROM public.roles WHERE name IN ('caseworker', 'case_worker') LIMIT 1;
  
  -- If no caseworker role exists, create it
  IF caseworker_role_id IS NULL THEN
    INSERT INTO public.roles (name, description, role_type, is_system)
    VALUES ('caseworker', 'Case Worker - can manage cases and view reports', 'internal', false)
    RETURNING id INTO caseworker_role_id;
    RAISE NOTICE 'Created new caseworker role with ID: %', caseworker_role_id;
  END IF;

  -- Clear existing permissions for this role to avoid conflicts
  DELETE FROM public.permissions WHERE role_id = caseworker_role_id;
  RAISE NOTICE 'Cleared existing permissions for caseworker role';

  -- Grant full permissions for core functionality that caseworkers should see
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
      'knowledge',
      'insights'
    ) AND is_active = true
  LOOP
    INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_record.id, true, true);
    RAISE NOTICE 'Added full permission for caseworker: %', registry_record.element_key;
  END LOOP;

  -- Grant view-only permissions for some restricted features
  FOR registry_record IN 
    SELECT id, element_key FROM public.frontend_registry 
    WHERE element_key IN (
      'reports.create_report',
      'reports.edit_report',
      'reports.delete_report'
    ) AND is_active = true
  LOOP
    INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_record.id, true, false);
    RAISE NOTICE 'Added view-only permission for caseworker: %', registry_record.element_key;
  END LOOP;

  -- Explicitly deny access to admin features
  FOR registry_record IN 
    SELECT id, element_key FROM public.frontend_registry 
    WHERE element_key IN (
      'users_management',
      'permissions_management', 
      'roles_management'
    ) AND is_active = true
  LOOP
    INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
    VALUES (caseworker_role_id, registry_record.id, false, false);
    RAISE NOTICE 'Denied admin permission for caseworker: %', registry_record.element_key;
  END LOOP;

  -- Debug output
  RAISE NOTICE 'Caseworker permissions setup completed for role ID: %', caseworker_role_id;
  
  -- Show final count
  RAISE NOTICE 'Total permissions granted to caseworker: %', 
    (SELECT COUNT(*) FROM public.permissions WHERE role_id = caseworker_role_id);
END $$;

-- Verify the setup
DO $$
DECLARE
  permission_count INTEGER;
  caseworker_role_id UUID;
BEGIN
  SELECT id INTO caseworker_role_id FROM public.roles WHERE name IN ('caseworker', 'case_worker') LIMIT 1;
  
  SELECT COUNT(*) INTO permission_count 
  FROM public.permissions p
  WHERE p.role_id = caseworker_role_id;
  
  RAISE NOTICE 'Final verification - Caseworker role ID: %, Total permissions: %', 
    caseworker_role_id, permission_count;
    
  -- Show what permissions were granted
  FOR permission_count IN 
    SELECT 1 FROM public.permissions p
    JOIN public.frontend_registry fr ON p.frontend_registry_id = fr.id
    WHERE p.role_id = caseworker_role_id AND p.can_view = true
  LOOP
    RAISE NOTICE 'Permission granted: %', 
      (SELECT fr.element_key FROM public.frontend_registry fr 
       JOIN public.permissions p ON fr.id = p.frontend_registry_id 
       WHERE p.role_id = caseworker_role_id AND p.can_view = true 
       LIMIT 1);
  END LOOP;
END $$;
