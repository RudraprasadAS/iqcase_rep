
-- Re-enable RLS on cases table
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Add basic policies to allow case operations
CREATE POLICY "Allow authenticated users to view cases" 
ON public.cases FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert cases" 
ON public.cases FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cases" 
ON public.cases FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to delete cases" 
ON public.cases FOR DELETE 
TO authenticated 
USING (true);
