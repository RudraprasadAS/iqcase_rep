
-- First, let's ensure the frontend registry has the permission entries
INSERT INTO public.frontend_registry (element_key, module, screen, element_type, label, is_active) 
VALUES 
  ('users_management', 'admin', 'users', 'page', 'User Management', true),
  ('permissions_management', 'admin', 'permissions', 'page', 'Permissions Management', true),
  ('roles_management', 'admin', 'roles', 'page', 'Roles Management', true)
WHERE NOT EXISTS (
  SELECT 1 FROM public.frontend_registry 
  WHERE element_key IN ('users_management', 'permissions_management', 'roles_management')
);

-- Get the admin role ID and set permissions
DO $$
DECLARE
  admin_role_id UUID;
  perm_registry_id UUID;
  roles_registry_id UUID;
  users_registry_id UUID;
BEGIN
  -- Get admin role ID
  SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin' LIMIT 1;
  
  -- Get frontend registry IDs
  SELECT id INTO perm_registry_id FROM public.frontend_registry WHERE element_key = 'permissions_management' LIMIT 1;
  SELECT id INTO roles_registry_id FROM public.frontend_registry WHERE element_key = 'roles_management' LIMIT 1;
  SELECT id INTO users_registry_id FROM public.frontend_registry WHERE element_key = 'users_management' LIMIT 1;
  
  IF admin_role_id IS NOT NULL THEN
    -- Give admin full permissions to permissions management
    IF perm_registry_id IS NOT NULL THEN
      INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
      VALUES (admin_role_id, perm_registry_id, true, true)
      ON CONFLICT (role_id, frontend_registry_id) 
      DO UPDATE SET can_view = true, can_edit = true, updated_at = now();
    END IF;
    
    -- Give admin full permissions to roles management
    IF roles_registry_id IS NOT NULL THEN
      INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
      VALUES (admin_role_id, roles_registry_id, true, true)
      ON CONFLICT (role_id, frontend_registry_id) 
      DO UPDATE SET can_view = true, can_edit = true, updated_at = now();
    END IF;
    
    -- Give admin full permissions to users management
    IF users_registry_id IS NOT NULL THEN
      INSERT INTO public.permissions (role_id, frontend_registry_id, can_view, can_edit)
      VALUES (admin_role_id, users_registry_id, true, true)
      ON CONFLICT (role_id, frontend_registry_id) 
      DO UPDATE SET can_view = true, can_edit = true, updated_at = now();
    END IF;
  END IF;
END $$;

-- Fix notifications RLS policies to work with the current user functions
DROP POLICY IF EXISTS "Users can view notifications sent to them" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications for any user" ON public.notifications;

-- Create working notification policies
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications 
  FOR DELETE 
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

