
-- First, let's ensure we have the proper roles structure
INSERT INTO roles (name, description, is_system, role_type) 
VALUES 
  ('super_admin', 'Super Administrator with full system access', true, 'internal'),
  ('admin', 'System Administrator', true, 'internal'),
  ('citizen', 'External citizen user', true, 'external'),
  ('case_worker', 'Internal case worker', true, 'internal'),
  ('manager', 'Internal manager', true, 'internal')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system,
  role_type = EXCLUDED.role_type;

-- Get the super_admin role ID
DO $$
DECLARE
  super_admin_role_id UUID;
  admin_role_id UUID;
  user_exists BOOLEAN;
  auth_user_uuid UUID;
BEGIN
  -- Get super_admin role ID
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
  
  -- Get admin role ID as fallback
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  -- Check if user exists in auth.users and get their UUID
  SELECT id INTO auth_user_uuid FROM auth.users WHERE email = 'rudraprasad.as@gmail.com';
  
  -- Check if user exists in our users table
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'rudraprasad.as@gmail.com') INTO user_exists;
  
  -- If user doesn't exist in our users table, create them
  IF NOT user_exists THEN
    INSERT INTO users (email, name, role_id, user_type, is_active, auth_user_id)
    VALUES (
      'rudraprasad.as@gmail.com', 
      'Rudra Prasad (Super Admin)', 
      COALESCE(super_admin_role_id, admin_role_id), 
      'internal', 
      true,
      auth_user_uuid
    );
  ELSE
    -- If user exists, update their role and ensure they're active
    UPDATE users 
    SET 
      role_id = COALESCE(super_admin_role_id, admin_role_id), 
      user_type = 'internal', 
      is_active = true,
      auth_user_id = COALESCE(auth_user_id, auth_user_uuid),
      name = 'Rudra Prasad (Super Admin)'
    WHERE email = 'rudraprasad.as@gmail.com';
  END IF;
  
  -- Grant super admin permissions to all modules and fields
  -- First clean up any existing permissions for super_admin role
  DELETE FROM permissions WHERE role_id = super_admin_role_id;
  
  -- Grant full permissions to super_admin for all major modules
  INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit) VALUES
    (super_admin_role_id, 'users', NULL, true, true),
    (super_admin_role_id, 'roles', NULL, true, true),
    (super_admin_role_id, 'permissions', NULL, true, true),
    (super_admin_role_id, 'cases', NULL, true, true),
    (super_admin_role_id, 'case_categories', NULL, true, true),
    (super_admin_role_id, 'reports', NULL, true, true),
    (super_admin_role_id, 'dashboards', NULL, true, true),
    (super_admin_role_id, 'notifications', NULL, true, true),
    (super_admin_role_id, 'insights', NULL, true, true),
    (super_admin_role_id, 'knowledge', NULL, true, true);
    
  -- Also grant admin permissions to all modules and fields if admin role exists
  IF admin_role_id IS NOT NULL THEN
    DELETE FROM permissions WHERE role_id = admin_role_id;
    
    INSERT INTO permissions (role_id, module_name, field_name, can_view, can_edit) VALUES
      (admin_role_id, 'users', NULL, true, true),
      (admin_role_id, 'roles', NULL, true, true),
      (admin_role_id, 'permissions', NULL, true, true),
      (admin_role_id, 'cases', NULL, true, true),
      (admin_role_id, 'case_categories', NULL, true, true),
      (admin_role_id, 'reports', NULL, true, true),
      (admin_role_id, 'dashboards', NULL, true, true),
      (admin_role_id, 'notifications', NULL, true, true),
      (admin_role_id, 'insights', NULL, true, true),
      (admin_role_id, 'knowledge', NULL, true, true);
  END IF;
  
END $$;

-- Make sure RLS policies allow super_admin and admin access
-- Update the existing admin policies to include super_admin
DROP POLICY IF EXISTS "admins_can_manage_roles" ON roles;
CREATE POLICY "admins_can_manage_roles" ON roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "admins_can_manage_users" ON users;
CREATE POLICY "admins_can_manage_users" ON users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "admins_can_manage_permissions" ON permissions;
CREATE POLICY "admins_can_manage_permissions" ON permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);

DROP POLICY IF EXISTS "admins_can_manage_categories" ON case_categories;
CREATE POLICY "admins_can_manage_categories" ON case_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('admin', 'super_admin')
  )
);
