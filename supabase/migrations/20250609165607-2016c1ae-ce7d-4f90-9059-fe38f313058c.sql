
-- Enable RLS on roles table and create policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view roles (needed for permission management)
CREATE POLICY "authenticated_users_can_view_roles" ON roles
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow users with admin role to manage roles
CREATE POLICY "admins_can_manage_roles" ON roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name = 'admin'
  )
);

-- Enable RLS on case_categories and create policies
ALTER TABLE case_categories ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view categories
CREATE POLICY "authenticated_users_can_view_categories" ON case_categories
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow admins to manage categories
CREATE POLICY "admins_can_manage_categories" ON case_categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name = 'admin'
  )
);

-- Enable RLS on users table and create policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "users_can_view_own_profile" ON users
FOR SELECT 
USING (auth_user_id = auth.uid());

-- Allow admins to view and manage all users
CREATE POLICY "admins_can_manage_users" ON users
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name = 'admin'
  )
);

-- Enable RLS on permissions table and create policies
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Allow admins to view and manage all permissions
CREATE POLICY "admins_can_manage_permissions" ON permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name = 'admin'
  )
);

-- Allow users to view permissions for their own role
CREATE POLICY "users_can_view_own_role_permissions" ON permissions
FOR SELECT
USING (
  role_id IN (
    SELECT u.role_id FROM users u 
    WHERE u.auth_user_id = auth.uid()
  )
);

-- Create a policy to ensure rudraprasad.as@gmail.com gets admin access
-- First, let's make sure there's an admin role and the user has it
DO $$
DECLARE
  admin_role_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Check if admin role exists, create if not
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  IF admin_role_id IS NULL THEN
    INSERT INTO roles (name, description, is_system, role_type) 
    VALUES ('admin', 'System Administrator', true, 'internal') 
    RETURNING id INTO admin_role_id;
  END IF;
  
  -- Check if the user exists in our users table
  SELECT EXISTS(SELECT 1 FROM users WHERE email = 'rudraprasad.as@gmail.com') INTO user_exists;
  
  -- If user doesn't exist, create them with admin role
  IF NOT user_exists THEN
    INSERT INTO users (email, name, role_id, user_type, is_active)
    VALUES ('rudraprasad.as@gmail.com', 'Rudra Prasad', admin_role_id, 'internal', true);
  ELSE
    -- If user exists, update their role to admin
    UPDATE users 
    SET role_id = admin_role_id, user_type = 'internal', is_active = true
    WHERE email = 'rudraprasad.as@gmail.com';
  END IF;
END $$;

-- Create basic roles if they don't exist
INSERT INTO roles (name, description, is_system, role_type) 
VALUES 
  ('citizen', 'External citizen user', true, 'external'),
  ('case_worker', 'Internal case worker', true, 'internal'),
  ('manager', 'Internal manager', true, 'internal')
ON CONFLICT (name) DO NOTHING;

-- Create some basic categories if they don't exist
INSERT INTO case_categories (name, description, is_active)
VALUES 
  ('General Inquiry', 'General questions and inquiries', true),
  ('Public Works', 'Roads, utilities, and infrastructure', true),
  ('Public Safety', 'Police, fire, and emergency services', true),
  ('Parks and Recreation', 'Parks, sports facilities, and events', true),
  ('Code Enforcement', 'Building codes and violations', true)
ON CONFLICT DO NOTHING;
