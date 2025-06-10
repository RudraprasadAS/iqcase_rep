
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

-- Now create fresh policies with clear names using the new comprehensive function
-- 1. Super Admins and Admins can see ALL cases
CREATE POLICY "admins_view_all_cases" ON public.cases
FOR SELECT 
USING (
  (SELECT has_management_access FROM public.get_current_user_info() LIMIT 1) = true
);

-- 2. Case workers can see cases they're involved with
CREATE POLICY "case_workers_view_involved_cases" ON public.cases
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

-- 3. Citizens can see their own cases
CREATE POLICY "citizens_view_own_cases" ON public.cases
FOR SELECT 
USING (
  (SELECT is_citizen FROM public.get_current_user_info() LIMIT 1) = true
  AND (SELECT user_id FROM public.get_current_user_info() LIMIT 1) = cases.submitted_by
);

-- 4. Other internal users can see cases they're directly involved with
CREATE POLICY "internal_users_view_assigned_cases" ON public.cases
FOR SELECT 
USING (
  (SELECT is_internal FROM public.get_current_user_info() LIMIT 1) = true
  AND (SELECT is_citizen FROM public.get_current_user_info() LIMIT 1) = false
  AND (SELECT has_management_access FROM public.get_current_user_info() LIMIT 1) = false
  AND (SELECT is_case_worker FROM public.get_current_user_info() LIMIT 1) = false
  AND (
    (SELECT user_id FROM public.get_current_user_info() LIMIT 1) = cases.submitted_by 
    OR 
    (SELECT user_id FROM public.get_current_user_info() LIMIT 1) = cases.assigned_to
  )
);

-- UPDATE policies
-- Admins can update all cases
CREATE POLICY "admins_update_all_cases" ON public.cases
FOR UPDATE 
USING (
  (SELECT has_management_access FROM public.get_current_user_info() LIMIT 1) = true
);

-- Case workers can update cases they're involved with
CREATE POLICY "case_workers_update_assigned_cases" ON public.cases
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

-- INSERT policies
-- Admins can create cases
CREATE POLICY "admins_insert_cases" ON public.cases
FOR INSERT 
WITH CHECK (
  (SELECT has_management_access FROM public.get_current_user_info() LIMIT 1) = true
);

-- Citizens can create their own cases
CREATE POLICY "citizens_insert_own_cases" ON public.cases
FOR INSERT 
WITH CHECK (
  (SELECT is_citizen FROM public.get_current_user_info() LIMIT 1) = true
  AND (SELECT user_id FROM public.get_current_user_info() LIMIT 1) = submitted_by
);
