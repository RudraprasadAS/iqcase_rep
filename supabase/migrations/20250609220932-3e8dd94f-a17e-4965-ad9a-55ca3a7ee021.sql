
-- First, let's check if the superadmin role has permissions for the 'cases' element
-- and create them if they don't exist

-- Get the frontend registry ID for 'cases'
DO $$
DECLARE
    cases_registry_id UUID;
    superadmin_role_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get the frontend registry ID for 'cases'
    SELECT id INTO cases_registry_id 
    FROM public.frontend_registry 
    WHERE element_key = 'cases' AND is_active = true;
    
    -- Get superadmin role ID
    SELECT id INTO superadmin_role_id 
    FROM public.roles 
    WHERE name = 'super_admin';
    
    -- Get admin role ID  
    SELECT id INTO admin_role_id 
    FROM public.roles 
    WHERE name = 'admin';
    
    -- If cases registry exists and superadmin role exists
    IF cases_registry_id IS NOT NULL AND superadmin_role_id IS NOT NULL THEN
        -- Insert or update permission for superadmin
        INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
        VALUES (superadmin_role_id, cases_registry_id, true, true)
        ON CONFLICT (role_id, frontend_registry_id) 
        DO UPDATE SET can_view = true, can_edit = true, updated_at = now();
        
        RAISE NOTICE 'Superadmin permissions for cases updated';
    END IF;
    
    -- If cases registry exists and admin role exists
    IF cases_registry_id IS NOT NULL AND admin_role_id IS NOT NULL THEN
        -- Insert or update permission for admin
        INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
        VALUES (admin_role_id, cases_registry_id, true, true)
        ON CONFLICT (role_id, frontend_registry_id) 
        DO UPDATE SET can_view = true, can_edit = true, updated_at = now();
        
        RAISE NOTICE 'Admin permissions for cases updated';
    END IF;
END $$;

-- Also grant permissions for all other main elements to superadmin and admin
DO $$
DECLARE
    registry_record RECORD;
    superadmin_role_id UUID;
    admin_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO superadmin_role_id FROM public.roles WHERE name = 'super_admin';
    SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
    
    -- Grant permissions for main elements
    FOR registry_record IN 
        SELECT id, element_key FROM public.frontend_registry 
        WHERE element_key IN ('dashboard', 'cases', 'notifications', 'reports', 'users_management', 'roles_and_permissions')
        AND is_active = true
    LOOP
        -- Superadmin permissions
        IF superadmin_role_id IS NOT NULL THEN
            INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
            VALUES (superadmin_role_id, registry_record.id, true, true)
            ON CONFLICT (role_id, frontend_registry_id) 
            DO UPDATE SET can_view = true, can_edit = true, updated_at = now();
        END IF;
        
        -- Admin permissions  
        IF admin_role_id IS NOT NULL THEN
            INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
            VALUES (admin_role_id, registry_record.id, true, true)
            ON CONFLICT (role_id, frontend_registry_id) 
            DO UPDATE SET can_view = true, can_edit = true, updated_at = now();
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All main permissions granted to superadmin and admin roles';
END $$;

-- Let's also check if your user actually has the superadmin role
-- and fix it if needed
UPDATE public.users 
SET role_id = (SELECT id FROM public.roles WHERE name = 'super_admin' LIMIT 1)
WHERE auth_user_id = '18a5f25a-860f-42ca-ac6f-ae0247447a17'
AND role_id IS NULL OR role_id != (SELECT id FROM public.roles WHERE name = 'super_admin' LIMIT 1);
