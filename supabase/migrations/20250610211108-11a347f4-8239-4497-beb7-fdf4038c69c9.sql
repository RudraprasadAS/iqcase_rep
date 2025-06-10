
-- First, let's check what roles exist and fix the caseworker detection
-- The issue might be that the role name is 'caseworker' not 'case_worker'

-- Update the get_current_user_info function to properly detect caseworkers
CREATE OR REPLACE FUNCTION public.get_current_user_info()
RETURNS TABLE(user_id uuid, role_name text, role_type text, user_type text, is_active boolean, is_admin boolean, is_super_admin boolean, is_case_worker boolean, is_citizen boolean, is_internal boolean, is_external boolean, has_management_access boolean)
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
    (user_record.role_name IN ('caseworker', 'case_worker'))::BOOLEAN,  -- Support both variations
    (user_record.role_name = 'citizen')::BOOLEAN,
    (user_record.user_type = 'internal')::BOOLEAN,
    (user_record.user_type = 'external' OR user_record.role_name = 'citizen')::BOOLEAN,
    (user_record.role_name IN ('admin', 'super_admin'))::BOOLEAN;
END;
$$;

-- Now create a simpler, more reliable INSERT policy
DROP POLICY IF EXISTS "authenticated_users_can_insert_cases" ON public.cases;

CREATE POLICY "users_can_insert_cases" ON public.cases
FOR INSERT 
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- Allow if user exists in users table and is active
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.auth_user_id = auth.uid() 
    AND u.is_active = true
    AND u.id = submitted_by
  )
);
