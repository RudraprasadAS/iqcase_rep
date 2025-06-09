
-- Check current policies on users table and fix them
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
DROP POLICY IF EXISTS "admins_can_manage_users" ON users;

-- Create proper policies that allow super admins and admins to manage users
CREATE POLICY "users_can_view_own_profile" ON users
FOR SELECT 
USING (
  auth_user_id = auth.uid() 
  OR
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('super_admin', 'admin')
  )
);

CREATE POLICY "admins_can_insert_users" ON users
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('super_admin', 'admin')
  )
);

CREATE POLICY "admins_can_update_users" ON users
FOR UPDATE
USING (
  auth_user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('super_admin', 'admin')
  )
);

CREATE POLICY "admins_can_delete_users" ON users
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('super_admin', 'admin')
  )
);
