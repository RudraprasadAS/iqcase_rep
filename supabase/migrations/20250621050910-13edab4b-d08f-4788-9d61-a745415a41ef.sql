
-- Create a security definer function to check if current user has admin role
CREATE OR REPLACE FUNCTION public.is_current_user_admin_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'admin'
    AND u.is_active = true
  );
$$;

-- Create RLS policy on permissions table to restrict admin access
DROP POLICY IF EXISTS "Only admins can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Only admins can edit permissions" ON public.permissions;

CREATE POLICY "Only admins can view permissions" 
  ON public.permissions 
  FOR SELECT 
  USING (public.is_current_user_admin_role());

CREATE POLICY "Only admins can edit permissions" 
  ON public.permissions 
  FOR ALL 
  USING (public.is_current_user_admin_role())
  WITH CHECK (public.is_current_user_admin_role());

-- Apply similar policies to roles table
DROP POLICY IF EXISTS "Only admins can view roles" ON public.roles;
DROP POLICY IF EXISTS "Only admins can edit roles" ON public.roles;

CREATE POLICY "Only admins can view roles" 
  ON public.roles 
  FOR SELECT 
  USING (public.is_current_user_admin_role());

CREATE POLICY "Only admins can edit roles" 
  ON public.roles 
  FOR ALL 
  USING (public.is_current_user_admin_role())
  WITH CHECK (public.is_current_user_admin_role());

-- Apply similar policies to frontend_registry table
DROP POLICY IF EXISTS "Only admins can view frontend registry" ON public.frontend_registry;
DROP POLICY IF EXISTS "Only admins can edit frontend registry" ON public.frontend_registry;

CREATE POLICY "Only admins can view frontend registry" 
  ON public.frontend_registry 
  FOR SELECT 
  USING (public.is_current_user_admin_role());

CREATE POLICY "Only admins can edit frontend registry" 
  ON public.frontend_registry 
  FOR ALL 
  USING (public.is_current_user_admin_role())
  WITH CHECK (public.is_current_user_admin_role());
