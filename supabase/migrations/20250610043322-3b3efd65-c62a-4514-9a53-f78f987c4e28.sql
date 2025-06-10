
-- Update the get_current_user_info function to check for 'caseworker' instead of 'case_worker'
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
    (user_record.role_name = 'caseworker')::BOOLEAN,  -- Changed from 'case_worker' to 'caseworker'
    (user_record.role_name = 'citizen')::BOOLEAN,
    (user_record.user_type = 'internal')::BOOLEAN,
    (user_record.user_type = 'external' OR user_record.role_name = 'citizen')::BOOLEAN,
    (user_record.role_name IN ('admin', 'super_admin'))::BOOLEAN;
END;
$$;

-- Also update the RLS policies to use 'caseworker' instead of 'case_worker'
DROP POLICY IF EXISTS "case_workers_view_involved_cases" ON public.cases;
DROP POLICY IF EXISTS "case_workers_update_assigned_cases" ON public.cases;

-- Create new policies with correct role name
CREATE POLICY "caseworkers_view_involved_cases" ON public.cases
FOR SELECT 
USING (
  (SELECT is_case_worker FROM public.get_current_user_info() LIMIT 1) = true
  AND (
    -- Cases directly assigned to them
    (SELECT user_id FROM public.get_current_user_info() LIMIT 1) = cases.assigned_to
    OR
    -- Cases they submitted
    (SELECT user_id FROM public.get_current_user_info() LIMIT 1) = cases.submitted_by
    OR
    -- Cases where they have tasks assigned
    EXISTS (
      SELECT 1 FROM public.case_tasks ct
      WHERE ct.case_id = cases.id
      AND ct.assigned_to = (SELECT user_id FROM public.get_current_user_info() LIMIT 1)
    )
    OR
    -- Cases where they have sent any message
    EXISTS (
      SELECT 1 FROM public.case_messages cm
      WHERE cm.case_id = cases.id
      AND cm.sender_id = (SELECT user_id FROM public.get_current_user_info() LIMIT 1)
    )
    OR
    -- Cases where they have added notes
    EXISTS (
      SELECT 1 FROM public.case_notes cn
      WHERE cn.case_id = cases.id
      AND cn.author_id = (SELECT user_id FROM public.get_current_user_info() LIMIT 1)
    )
    OR
    -- Cases where they are watchers
    EXISTS (
      SELECT 1 FROM public.case_watchers cw
      WHERE cw.case_id = cases.id
      AND cw.user_id = (SELECT user_id FROM public.get_current_user_info() LIMIT 1)
    )
    OR
    -- Cases where they have activities logged
    EXISTS (
      SELECT 1 FROM public.case_activities ca
      WHERE ca.case_id = cases.id
      AND ca.performed_by = (SELECT user_id FROM public.get_current_user_info() LIMIT 1)
    )
  )
);

-- Caseworkers can update cases they're involved with
CREATE POLICY "caseworkers_update_assigned_cases" ON public.cases
FOR UPDATE 
USING (
  (SELECT is_case_worker FROM public.get_current_user_info() LIMIT 1) = true
  AND (
    (SELECT user_id FROM public.get_current_user_info() LIMIT 1) = cases.assigned_to
    OR
    EXISTS (
      SELECT 1 FROM public.case_tasks ct
      WHERE ct.case_id = cases.id
      AND ct.assigned_to = (SELECT user_id FROM public.get_current_user_info() LIMIT 1)
    )
  )
);
