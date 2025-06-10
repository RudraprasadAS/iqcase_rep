
-- Drop ALL existing policies on the cases table
DROP POLICY IF EXISTS "admins_view_all_cases" ON public.cases;
DROP POLICY IF EXISTS "caseworkers_view_involved_cases" ON public.cases;
DROP POLICY IF EXISTS "citizens_view_own_cases" ON public.cases;
DROP POLICY IF EXISTS "internal_users_view_assigned_cases" ON public.cases;
DROP POLICY IF EXISTS "admins_update_all_cases" ON public.cases;
DROP POLICY IF EXISTS "caseworkers_update_assigned_cases" ON public.cases;
DROP POLICY IF EXISTS "admins_insert_cases" ON public.cases;
DROP POLICY IF EXISTS "citizens_insert_own_cases" ON public.cases;

-- Also drop any other potential case policies that might exist
DROP POLICY IF EXISTS "Case workers comprehensive access" ON public.cases;
DROP POLICY IF EXISTS "Admins can view all cases" ON public.cases;
DROP POLICY IF EXISTS "Citizens can view own cases" ON public.cases;
DROP POLICY IF EXISTS "Internal users can view involved cases" ON public.cases;
DROP POLICY IF EXISTS "Case workers can update related cases" ON public.cases;
DROP POLICY IF EXISTS "Admins can update all cases" ON public.cases;
DROP POLICY IF EXISTS "Admins can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Citizens can insert own cases" ON public.cases;

-- Temporarily disable RLS on cases table so we can test without any restrictions
ALTER TABLE public.cases DISABLE ROW LEVEL SECURITY;
