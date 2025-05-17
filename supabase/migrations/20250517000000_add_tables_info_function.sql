
-- Function to get tables information
CREATE OR REPLACE FUNCTION public.get_tables_info()
RETURNS TABLE (
  name text,
  schema text,
  fields text[]
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text as name,
    t.table_schema::text as schema,
    array_agg(c.column_name::text)::text[] as fields
  FROM 
    information_schema.tables t
  JOIN 
    information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
  WHERE 
    t.table_schema = 'public' AND
    t.table_type = 'BASE TABLE' AND
    t.table_name NOT LIKE 'pg_%'
  GROUP BY 
    t.table_schema, t.table_name
  ORDER BY 
    t.table_name;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tables_info() TO authenticated;
