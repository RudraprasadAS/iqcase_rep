
-- Drop existing problematic RLS policies on cases table
DROP POLICY IF EXISTS "case_contextual_access" ON cases;
DROP POLICY IF EXISTS "case_update_assigned_only" ON cases;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_accessible_cases()
RETURNS TABLE(case_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT c.id as case_id
  FROM cases c
  WHERE 
    -- User is assigned to the case
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = c.assigned_to
    )
    -- OR user submitted the case
    OR auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = c.submitted_by
    )
    -- OR user is a watcher
    OR auth.uid() IN (
      SELECT auth_user_id FROM users u 
      JOIN case_watchers cw ON u.id = cw.user_id 
      WHERE cw.case_id = c.id
    )
    -- OR user has tasks for this case
    OR auth.uid() IN (
      SELECT auth_user_id FROM users u 
      JOIN case_tasks ct ON u.id = ct.assigned_to 
      WHERE ct.case_id = c.id
    )
    -- OR user has sent messages for this case
    OR auth.uid() IN (
      SELECT auth_user_id FROM users u 
      JOIN case_messages cm ON u.id = cm.sender_id 
      WHERE cm.case_id = c.id
    )
    -- OR user is admin/manager (has full access)
    OR auth.uid() IN (
      SELECT auth_user_id FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE r.name IN ('admin', 'super_admin', 'manager')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_user_edit_case(case_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    -- User is assigned to the case
    SELECT 1 FROM cases c
    WHERE c.id = case_id
    AND auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = c.assigned_to
    )
  ) OR EXISTS (
    -- OR user is admin/manager/caseworker
    SELECT 1 FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('admin', 'super_admin', 'manager', 'caseworker')
  );
END;
$$;

-- Create new RLS policies using the security definer functions
CREATE POLICY "users_can_view_accessible_cases" ON cases
FOR SELECT USING (
  id IN (SELECT case_id FROM public.get_user_accessible_cases())
);

CREATE POLICY "users_can_edit_cases_with_permission" ON cases
FOR UPDATE USING (
  public.can_user_edit_case(id)
);

CREATE POLICY "users_can_insert_cases" ON cases
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT auth_user_id FROM users WHERE id = submitted_by
  )
);
