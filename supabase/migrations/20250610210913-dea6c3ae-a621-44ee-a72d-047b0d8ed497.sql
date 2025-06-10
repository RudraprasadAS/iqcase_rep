
-- Drop the existing restrictive INSERT policies
DROP POLICY IF EXISTS "admins_insert_cases" ON public.cases;
DROP POLICY IF EXISTS "citizens_insert_own_cases" ON public.cases;

-- Create a more permissive INSERT policy that allows:
-- 1. Admins to create cases
-- 2. Caseworkers to create cases  
-- 3. Citizens to create their own cases
-- 4. Any authenticated internal user to create cases
CREATE POLICY "authenticated_users_can_insert_cases" ON public.cases
FOR INSERT 
WITH CHECK (
  -- Must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- And either:
  (
    -- Admin/management access
    (SELECT has_management_access FROM public.get_current_user_info() LIMIT 1) = true
    OR
    -- Caseworker
    (SELECT is_case_worker FROM public.get_current_user_info() LIMIT 1) = true
    OR
    -- Citizen creating their own case
    (
      (SELECT is_citizen FROM public.get_current_user_info() LIMIT 1) = true
      AND (SELECT user_id FROM public.get_current_user_info() LIMIT 1) = submitted_by
    )
    OR
    -- Any internal user
    (SELECT is_internal FROM public.get_current_user_info() LIMIT 1) = true
  )
);
