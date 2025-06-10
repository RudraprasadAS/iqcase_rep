
-- Drop the existing case worker policy to replace it with a more comprehensive one
DROP POLICY IF EXISTS "Case workers can view assigned cases" ON public.cases;

-- Create a comprehensive policy for case workers that includes:
-- 1. Cases directly assigned to them
-- 2. Cases where they have tasks assigned
-- 3. Cases where they are mentioned in internal messages
CREATE POLICY "Case workers can view related cases" ON public.cases
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'case_worker'
    AND u.is_active = true
    AND (
      -- Cases directly assigned to them
      u.id = cases.assigned_to
      OR
      -- Cases where they have tasks assigned
      EXISTS (
        SELECT 1 FROM public.case_tasks ct
        WHERE ct.case_id = cases.id
        AND ct.assigned_to = u.id
      )
      OR
      -- Cases where they are mentioned in internal messages
      EXISTS (
        SELECT 1 FROM public.case_messages cm
        WHERE cm.case_id = cases.id
        AND cm.is_internal = true
        AND cm.sender_id = u.id
      )
      OR
      -- Cases where they are watchers (if case_watchers table is used)
      EXISTS (
        SELECT 1 FROM public.case_watchers cw
        WHERE cw.case_id = cases.id
        AND cw.user_id = u.id
      )
    )
  )
);

-- Update the case worker update policy to match
DROP POLICY IF EXISTS "Case workers can update assigned cases" ON public.cases;

CREATE POLICY "Case workers can update related cases" ON public.cases
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'case_worker'
    AND u.is_active = true
    AND (
      -- Cases directly assigned to them
      u.id = cases.assigned_to
      OR
      -- Cases where they have tasks assigned
      EXISTS (
        SELECT 1 FROM public.case_tasks ct
        WHERE ct.case_id = cases.id
        AND ct.assigned_to = u.id
      )
    )
  )
);
