
-- First, create the comprehensive function
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE(
  user_id UUID,
  role_name TEXT,
  role_type TEXT,
  user_type TEXT,
  is_active BOOLEAN,
  is_admin BOOLEAN,
  is_super_admin BOOLEAN,
  is_case_worker BOOLEAN,
  is_citizen BOOLEAN,
  is_internal BOOLEAN,
  is_external BOOLEAN,
  has_management_access BOOLEAN
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Get user and role information in one query
  SELECT 
    u.id,
    u.user_type,
    u.is_active,
    r.name as role_name,
    r.role_type
  INTO user_record
  FROM public.users u
  JOIN public.roles r ON u.role_id = r.id
  WHERE u.auth_user_id = auth.uid()
  AND u.is_active = true;

  -- If no user found, return null values
  IF user_record IS NULL THEN
    RETURN QUERY SELECT 
      NULL::UUID,
      NULL::TEXT,
      NULL::TEXT,
      NULL::TEXT,
      FALSE,
      FALSE,
      FALSE,
      FALSE,
      FALSE,
      FALSE,
      FALSE,
      FALSE;
    RETURN;
  END IF;

  -- Return comprehensive user info with calculated flags
  RETURN QUERY SELECT
    user_record.id,
    user_record.role_name,
    user_record.role_type,
    user_record.user_type,
    user_record.is_active,
    (user_record.role_name = 'admin')::BOOLEAN,
    (user_record.role_name = 'super_admin')::BOOLEAN,
    (user_record.role_name = 'case_worker')::BOOLEAN,
    (user_record.role_name = 'citizen')::BOOLEAN,
    (user_record.user_type = 'internal')::BOOLEAN,
    (user_record.user_type = 'external' OR user_record.role_name = 'citizen')::BOOLEAN,
    (user_record.role_name IN ('admin', 'super_admin'))::BOOLEAN;
END;
$$;

-- Now update the helper functions to use the new main function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE((SELECT is_admin OR is_super_admin FROM public.get_current_user_info() LIMIT 1), FALSE);
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role_name()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role_name FROM public.get_current_user_info() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT user_id FROM public.get_current_user_info() LIMIT 1;
$$;
