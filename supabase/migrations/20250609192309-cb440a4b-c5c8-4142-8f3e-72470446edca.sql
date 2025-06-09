
-- Drop the problematic RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "users_can_view_own_profile" ON users;
DROP POLICY IF EXISTS "admins_can_insert_users" ON users;
DROP POLICY IF EXISTS "admins_can_update_users" ON users;
DROP POLICY IF EXISTS "admins_can_delete_users" ON users;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role_name()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT r.name 
  FROM users u 
  JOIN roles r ON u.role_id = r.id 
  WHERE u.auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid() 
    AND r.name IN ('super_admin', 'admin')
  );
$$;

-- Create new RLS policies that don't cause recursion
CREATE POLICY "users_can_view_own_profile" ON users
FOR SELECT 
USING (auth_user_id = auth.uid());

CREATE POLICY "admins_can_view_all_users" ON users
FOR SELECT 
USING (public.is_current_user_admin());

CREATE POLICY "admins_can_insert_users" ON users
FOR INSERT
WITH CHECK (public.is_current_user_admin());

CREATE POLICY "users_can_update_own_profile" ON users
FOR UPDATE
USING (auth_user_id = auth.uid());

CREATE POLICY "admins_can_update_users" ON users
FOR UPDATE
USING (public.is_current_user_admin());

CREATE POLICY "admins_can_delete_users" ON users
FOR DELETE
USING (public.is_current_user_admin());
