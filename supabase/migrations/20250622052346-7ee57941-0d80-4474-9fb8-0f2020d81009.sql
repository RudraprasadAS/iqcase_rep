
-- First, let's temporarily disable RLS to test if that's the issue
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Let's also create a function to help debug the user mapping
CREATE OR REPLACE FUNCTION debug_user_mapping()
RETURNS TABLE(
  auth_uid uuid,
  internal_user_id uuid,
  user_email text,
  user_name text,
  role_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as auth_uid,
    u.id as internal_user_id,
    u.email as user_email,
    u.name as user_name,
    r.name as role_name
  FROM public.users u
  LEFT JOIN public.roles r ON u.role_id = r.id
  WHERE u.auth_user_id = auth.uid();
END;
$$;
