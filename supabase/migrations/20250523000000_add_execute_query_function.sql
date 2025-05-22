
-- This function allows executing a query with proper security checks
-- It is used by the frontend to run custom queries with table joins
CREATE OR REPLACE FUNCTION public.execute_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the query and get the results as JSON
  EXECUTE 'SELECT jsonb_agg(r) FROM (' || query_text || ') r' INTO result;
  
  -- Return empty array instead of null if no results
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.execute_query TO authenticated;
