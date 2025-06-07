import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Report, 
  ReportFilter, 
  TableInfo, 
  ReportData, 
  TableJoin,
  ReportConfigJson,
  ReportFilterJson,
  FilterOperator
} from '@/types/reports';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

export const useReports = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Fetch all reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      try {
        console.log('Fetching reports...');
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching reports:', error);
          throw error;
        }
        
        console.log('Reports fetched:', data);
        
        // Map DB structure to our interface
        return data.map(report => {
          // Parse filters if they're stored as string
          const parsedFilters = typeof report.filters === 'string' 
            ? JSON.parse(report.filters) 
            : report.filters;

          // Process filters to ensure they match ReportFilter type
          const processedFilters = Array.isArray(parsedFilters) 
            ? parsedFilters.map((filter: any) => ({
                field: filter.field,
                operator: filter.operator as FilterOperator,
                value: filter.value
              }))
            : [];

          return {
            ...report,
            fields: Array.isArray(report.selected_fields) 
              ? report.selected_fields as string[] 
              : [],
            selected_fields: report.selected_fields,
            base_table: report.base_table || report.module,
            module: report.module,
            filters: processedFilters,
            date_grouping: report.date_grouping // Ensure date_grouping is included
          } as Report;
        });
      } catch (error) {
        console.error('Error in fetchReports:', error);
        throw error;
      }
    }
  });

  // Create a new report
  const createReport = useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'created_at' | 'updated_at'>) => {
      // Convert filters for Supabase DB structure
      const filtersForDb = report.filters as unknown as Json;
      
      console.log("Creating report with data:", report);
      console.log("Date grouping being saved:", report.date_grouping);
      
      try {
        // Get the current user's ID from Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error("Authentication required. Please sign in.");
        }
        
        console.log("Auth user ID:", authUser.id);
        
        // Check if the user exists in the users table by auth_user_id
        const { data: userExists, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();
        
        let actualUserId = null;
        
        if (userCheckError && userCheckError.code !== 'PGRST116') {
          console.error("Error checking user existence:", userCheckError);
          throw new Error("Error checking user record.");
        }
        
        if (!userExists) {
          console.log("User does not exist in users table, attempting to create");
          
          // Check if a user with this email already exists
          const { data: existingEmailUser, error: emailCheckError } = await supabase
            .from('users')
            .select('id, auth_user_id')
            .eq('email', authUser.email || authUser.user_metadata?.email || '')
            .maybeSingle();
          
          if (emailCheckError && emailCheckError.code !== 'PGRST116') {
            console.error("Error checking email existence:", emailCheckError);
            throw new Error("Error checking existing user.");
          }
          
          if (existingEmailUser) {
            // Update the existing user record with the new auth_user_id
            console.log("Updating existing user with new auth_user_id");
            const { data: updatedUser, error: updateUserError } = await supabase
              .from('users')
              .update({ auth_user_id: authUser.id })
              .eq('id', existingEmailUser.id)
              .select('id')
              .single();
            
            if (updateUserError) {
              console.error("Error updating user record:", updateUserError);
              throw new Error("Could not update user record. Please contact an administrator.");
            }
            
            actualUserId = updatedUser.id;
          } else {
            // Create a new user record
            const { data: newUser, error: createUserError } = await supabase
              .from('users')
              .insert({
                name: authUser.user_metadata?.name || 'Anonymous User',
                email: authUser.email || authUser.user_metadata?.email || 'anonymous@example.com',
                auth_user_id: authUser.id,
                // Use a default role_id - this should be updated with a real role
                role_id: '00000000-0000-0000-0000-000000000000'
              })
              .select('id')
              .single();
            
            if (createUserError) {
              console.error("Error creating user record:", createUserError);
              throw new Error("Could not create user record. Please contact an administrator.");
            }
            
            actualUserId = newUser.id;
          }
        } else {
          // User exists, use their ID
          actualUserId = userExists.id;
        }
        
        console.log("Using user ID for report creation:", actualUserId);
        
        // Convert for Supabase DB structure
        const { data, error } = await supabase
          .from('reports')
          .insert({
            name: report.name,
            description: report.description,
            created_by: actualUserId, // Use the actual users table ID
            module: report.base_table || report.module, // Support both field names
            base_table: report.base_table || report.module, // Ensure base_table is included
            selected_fields: report.fields || report.selected_fields, // Support both field names
            filters: filtersForDb,
            aggregation: report.aggregation || null,
            chart_type: report.chart_type || 'table',
            group_by: report.group_by || null,
            date_grouping: report.date_grouping || null, // CRITICAL: Save date_grouping
            is_public: report.is_public || false
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error creating report:", error);
          throw error;
        }
        
        console.log("Created report with date_grouping:", data.date_grouping);
        
        // Map back to our interface
        return {
          ...data,
          fields: Array.isArray(data.selected_fields) ? data.selected_fields as string[] : [],
          selected_fields: data.selected_fields,
          base_table: data.base_table,
          module: data.module,
          filters: Array.isArray(data.filters) 
            ? data.filters.map((filter: any) => ({
                field: filter.field,
                operator: filter.operator as FilterOperator,
                value: filter.value
              }))
            : [],
          date_grouping: data.date_grouping // Ensure date_grouping is returned
        } as Report;
      } catch (error) {
        console.error("Error in createReport mutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Report created',
        description: 'Your report has been created successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create report: ${error.message}`
      });
    }
  });

  // Update a report
  const updateReport = useMutation({
    mutationFn: async ({ id, ...report }: Partial<Report> & { id: string }) => {
      // Convert filters to the format expected by the database
      const filtersForDb = report.filters as unknown as Json;
      
      console.log("Updating report with date_grouping:", report.date_grouping);
      
      // Convert for Supabase DB structure
      const { data, error } = await supabase
        .from('reports')
        .update({
          name: report.name,
          description: report.description,
          module: report.base_table || report.module,
          base_table: report.base_table || report.module,
          selected_fields: report.fields || report.selected_fields,
          filters: filtersForDb,
          aggregation: report.aggregation || null,
          chart_type: report.chart_type || 'table',
          group_by: report.group_by || null,
          date_grouping: report.date_grouping || null, // CRITICAL: Save date_grouping
          is_public: report.is_public
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      console.log("Updated report with date_grouping:", data.date_grouping);
      
      // Map back to our interface
      return {
        ...data,
        fields: Array.isArray(data.selected_fields) ? data.selected_fields as string[] : [],
        selected_fields: data.selected_fields,
        base_table: data.base_table,
        module: data.module,
        filters: Array.isArray(data.filters) 
          ? data.filters.map((filter: any) => ({
              field: filter.field,
              operator: filter.operator as FilterOperator,
              value: filter.value
            })) as ReportFilter[]
          : [],
        date_grouping: data.date_grouping // Ensure date_grouping is returned
      } as Report;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports', variables.id] });
      toast({
        title: 'Report updated',
        description: 'Your report has been updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update report: ${error.message}`
      });
    }
  });

  // Delete a report
  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      if (selectedReportId === id) {
        setSelectedReportId(null);
      }
      toast({
        title: 'Report deleted',
        description: 'The report has been deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete report: ${error.message}`
      });
    }
  });

  // Get available tables
  const { data: tables, isLoading: isLoadingTables } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      try {
        console.log('Fetching tables info...');
        const { data, error } = await supabase.rpc('get_tables_info');
        
        if (error) {
          console.error('Error fetching tables:', error);
          throw error;
        }
        
        console.log("Tables info from Supabase:", data);
        
        return data as TableInfo[];
      } catch (error) {
        console.error('Error in fetchTables:', error);
        throw error;
      }
    }
  });

  // Run a report with joined tables
  const runReportWithJoins = useMutation({
    mutationFn: async ({ 
      baseTable, 
      selectedColumns, 
      filters, 
      joins 
    }: { 
      baseTable: string; 
      selectedColumns: string[]; 
      filters: ReportFilter[]; 
      joins?: TableJoin[] 
    }) => {
      try {
        console.log(`Running report on table: ${baseTable} with joins:`, joins);
        console.log(`Selected columns:`, selectedColumns);
        
        // Start building the SQL query with selected columns
        let columnsToSelect;
        if (selectedColumns && selectedColumns.length > 0) {
          columnsToSelect = selectedColumns.map(col => {
            // Check if the column includes a table alias (e.g., 'users.name')
            if (col.includes('.')) {
              return col; // Already fully qualified
            }
            return `${baseTable}.${col}`;
          }).join(', ');
        } else {
          columnsToSelect = `${baseTable}.*`;
        }
        
        let sqlQuery = `
          SELECT ${columnsToSelect}
          FROM ${baseTable}
        `;
        
        // Add joins if specified, ensure unique aliases
        if (joins && joins.length > 0) {
          const processedJoins = new Map(); // To track tables we've already joined
          
          joins.forEach(join => {
            // Skip if we've already joined this table (prevents duplicates)
            if (processedJoins.has(join.table)) return;
            
            const joinType = join.joinType.toUpperCase();
            // Use the provided alias or the table name if no alias provided
            const alias = join.alias || join.table;
            
            sqlQuery += `
              ${joinType} JOIN ${join.table} AS ${alias}
              ON ${baseTable}.${join.sourceColumn} = ${alias}.${join.targetColumn}
            `;
            
            // Mark this table as processed
            processedJoins.set(join.table, true);
          });
        }
        
        // Add WHERE clause for filters
        if (filters && filters.length > 0) {
          const whereConditions = filters.map(filter => {
            const { field, operator, value } = filter;
            
            // Check if field includes a table prefix
            const fullField = field.includes('.') ? field : `${baseTable}.${field}`;
            
            switch (operator) {
              case 'eq':
                return `${fullField} = '${value}'`;
              case 'neq':
                return `${fullField} <> '${value}'`;
              case 'gt':
                return `${fullField} > '${value}'`;
              case 'gte':
                return `${fullField} >= '${value}'`;
              case 'lt':
                return `${fullField} < '${value}'`;
              case 'lte':
                return `${fullField} <= '${value}'`;
              case 'like':
                return `${fullField} LIKE '%${value}%'`;
              case 'ilike':
                return `${fullField} ILIKE '%${value}%'`;
              case 'is':
                if (value === null || value === 'null') {
                  return `${fullField} IS NULL`;
                } else if (value === true || value === 'true') {
                  return `${fullField} IS TRUE`;
                } else {
                  return `${fullField} IS FALSE`;
                }
              default:
                return '';
            }
          }).filter(condition => condition !== '');
          
          if (whereConditions.length > 0) {
            sqlQuery += `
              WHERE ${whereConditions.join(' AND ')}
            `;
          }
        }
        
        sqlQuery += `
          LIMIT 1000
        `;
        
        console.log("Executing SQL:", sqlQuery);
        
        // Use execute_query function to run the query
        const { data, error } = await supabase.rpc('execute_query', { 
          query_text: sqlQuery 
        });
        
        if (error) {
          console.error("Error running SQL query:", error);
          throw error;
        }
        
        console.log("Query results:", data);
        
        // Extract column names from the first result
        const columns = data && Array.isArray(data) && data.length > 0 
          ? Object.keys(data[0])
          : selectedColumns;
        
        return {
          columns,
          rows: Array.isArray(data) ? data : [],
          total: Array.isArray(data) ? data.length : 0
        } as ReportData;
      } catch (error) {
        console.error("Error in runReportWithJoins:", error);
        throw error;
      }
    }
  });

  return {
    reports,
    tables,
    isLoadingReports,
    isLoadingTables,
    setSelectedReportId,
    createReport,
    updateReport,
    deleteReport,
    runReportWithJoins
  };
};
