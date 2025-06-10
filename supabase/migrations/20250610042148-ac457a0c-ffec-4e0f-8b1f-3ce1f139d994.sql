
-- Drop ALL existing policies on cases table with more comprehensive cleanup
DO $$ 
DECLARE 
    pol record;
BEGIN
    -- Drop all policies on the cases table
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'cases' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.cases';
    END LOOP;
END $$;

-- Now create fresh policies with clear names
-- 1. Super Admins and Admins can see ALL cases
CREATE POLICY "admins_view_all_cases" ON public.cases
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND u.is_active = true
  )
);

-- 2. Case workers can see cases they're involved with
CREATE POLICY "case_workers_view_involved_cases" ON public.cases
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
      -- Cases they submitted
      u.id = cases.submitted_by
      OR
      -- Cases where they have tasks assigned
      EXISTS (
        SELECT 1 FROM public.case_tasks ct
        WHERE ct.case_id = cases.id
        AND ct.assigned_to = u.id
      )
      OR
      -- Cases where they have sent any message
      EXISTS (
        SELECT 1 FROM public.case_messages cm
        WHERE cm.case_id = cases.id
        AND cm.sender_id = u.id
      )
      OR
      -- Cases where they have added notes
      EXISTS (
        SELECT 1 FROM public.case_notes cn
        WHERE cn.case_id = cases.id
        AND cn.author_id = u.id
      )
      OR
      -- Cases where they are watchers
      EXISTS (
        SELECT 1 FROM public.case_watchers cw
        WHERE cw.case_id = cases.id
        AND cw.user_id = u.id
      )
      OR
      -- Cases where they have activities logged
      EXISTS (
        SELECT 1 FROM public.case_activities ca
        WHERE ca.case_id = cases.id
        AND ca.performed_by = u.id
      )
    )
  )
);

-- 3. Citizens can see their own cases
CREATE POLICY "citizens_view_own_cases" ON public.cases
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'citizen'
    AND u.is_active = true
    AND u.id = cases.submitted_by
  )
);

-- 4. Other internal users can see cases they're directly involved with
CREATE POLICY "internal_users_view_assigned_cases" ON public.cases
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND u.user_type = 'internal'
    AND r.name NOT IN ('super_admin', 'admin', 'case_worker', 'citizen')
    AND u.is_active = true
    AND (u.id = cases.submitted_by OR u.id = cases.assigned_to)
  )
);

-- UPDATE policies
-- Admins can update all cases
CREATE POLICY "admins_update_all_cases" ON public.cases
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND u.is_active = true
  )
);

-- Case workers can update cases they're involved with
CREATE POLICY "case_workers_update_assigned_cases" ON public.cases
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'case_worker'
    AND u.is_active = true
    AND (
      u.id = cases.assigned_to
      OR
      EXISTS (
        SELECT 1 FROM public.case_tasks ct
        WHERE ct.case_id = cases.id
        AND ct.assigned_to = u.id
      )
    )
  )
);

-- INSERT policies
-- Admins can create cases
CREATE POLICY "admins_insert_cases" ON public.cases
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name IN ('super_admin', 'admin')
    AND u.is_active = true
  )
);

-- Citizens can create their own cases
CREATE POLICY "citizens_insert_own_cases" ON public.cases
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.auth_user_id = auth.uid()
    AND r.name = 'citizen'
    AND u.is_active = true
    AND u.id = submitted_by
  )
);
