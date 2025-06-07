
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
  FilterOperator,
  ChartConfig
} from '@/types/reports';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';

export const useReports = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Get table relationships
  const { data: tableRelationships, isLoading: isLoadingRelationships } = useQuery({
    queryKey: ['tableRelationships'],
    queryFn: async () => {
      try {
        const relationships = [
          { sourceTable: 'cases', sourceColumn: 'assigned_to', targetTable: 'users', targetColumn: 'id' },
          { sourceTable: 'cases', sourceColumn: 'submitted_by', targetTable: 'users', targetColumn: 'id' },
          { sourceTable: 'case_activities', sourceColumn: 'case_id', targetTable: 'cases', targetColumn: 'id' },
          { sourceTable: 'case_activities', sourceColumn: 'performed_by', targetTable: 'users', targetColumn: 'id' },
          { sourceTable: 'case_messages', sourceColumn: 'case_id', targetTable: 'cases', targetColumn: 'id' },
          { sourceTable: 'case_messages', sourceColumn: 'sender_id', targetTable: 'users', targetColumn: 'id' },
          { sourceTable: 'case_notes', sourceColumn: 'case_id', targetTable: 'cases', targetColumn: 'id' },
          { sourceTable: 'case_notes', sourceColumn: 'author_id', targetTable: 'users', targetColumn: 'id' },
        ];
        return relationships;
      } catch (error) {
        console.error('Error fetching table relationships:', error);
        throw error;
      }
    }
  });

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
        
        return data.map(report => {
          const parsedFilters = typeof report.filters === 'string' 
            ? JSON.parse(report.filters) 
            : report.filters;

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
            filters: processedFilters
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
      const filtersForDb = report.filters as unknown as Json;
      
      console.log("Creating report with data:", report);
      
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error("Authentication required. Please sign in.");
        }
        
        console.log("Auth user ID:", authUser.id);
        
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
            const { data: newUser, error: createUserError } = await supabase
              .from('users')
              .insert({
                name: authUser.user_metadata?.name || 'Anonymous User',
                email: authUser.email || authUser.user_metadata?.email || 'anonymous@example.com',
                auth_user_id: authUser.id,
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
          actualUserId = userExists.id;
        }
        
        console.log("Using user ID for report creation:", actualUserId);
        
        const { data, error } = await supabase
          .from('reports')
          .insert({
            name: report.name,
            description: report.description,
            created_by: actualUserId,
            module: report.base_table || report.module,
            base_table: report.base_table || report.module,
            selected_fields: report.fields || report.selected_fields,
            filters: filtersForDb,
            aggregation: report.aggregation || null,
            chart_type: report.chart_type || 'table',
            group_by: report.group_by || null,
            is_public: report.is_public || false
          })
          .select()
          .single();
        
        if (error) {
          console.error("Error creating report:", error);
          throw error;
        }
        
        console.log("Created report:", data);
        
        const parsedFilters = typeof data.filters === 'string' 
          ? JSON.parse(data.filters) 
          : data.filters;

        const processedFilters = Array.isArray(parsedFilters) 
          ? parsedFilters.map((filter: any) => ({
              field: filter.field,
              operator: filter.operator as FilterOperator,
              value: filter.value
            }))
          : [];
        
        return {
          ...data,
          fields: Array.isArray(data.selected_fields) ? data.selected_fields as string[] : [],
          selected_fields: data.selected_fields,
          base_table: data.base_table || data.module,
          module: data.module,
          filters: processedFilters
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
        
        return data.map((table: TableInfo) => {
          if (tableRelationships) {
            const relations = tableRelationships.filter(rel => rel.sourceTable === table.name);
            if (relations.length > 0) {
              return {
                ...table,
                relations: relations.map(rel => ({
                  referencedTable: rel.targetTable,
                  sourceColumn: rel.sourceColumn,
                  targetColumn: rel.targetColumn
                }))
              };
            }
          }
          return table;
        }) as TableInfo[];
      } catch (error) {
        console.error('Error in fetchTables:', error);
        throw error;
      }
    },
    enabled: !isLoadingRelationships
  });

  // Run a report with joined tables
  const runReportWithJoins = useMutation({
    mutationFn: async ({ 
      baseTable, 
      selectedColumns, 
      filters, 
      joins,
      chartConfig 
    }: { 
      baseTable: string; 
      selectedColumns: string[]; 
      filters: ReportFilter[]; 
      joins?: TableJoin[];
      chartConfig?: ChartConfig;
    }) => {
      try {
        console.log(`Running report on table: ${baseTable} with joins:`, joins);
        console.log(`Selected columns:`, selectedColumns);
        console.log(`Chart config:`, chartConfig);
        
        let columnsToSelect;
        if (selectedColumns && selectedColumns.length > 0) {
          columnsToSelect = selectedColumns.map(col => {
            if (col.includes('.')) {
              return col;
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
        
        if (joins && joins.length > 0) {
          const processedJoins = new Map();
          
          joins.forEach(join => {
            if (processedJoins.has(join.table)) return;
            
            const joinType = join.joinType.toUpperCase();
            const alias = join.alias || join.table;
            
            sqlQuery += `
              ${joinType} JOIN ${join.table} AS ${alias}
              ON ${baseTable}.${join.sourceColumn} = ${alias}.${join.targetColumn}
            `;
            
            processedJoins.set(join.table, true);
          });
        }
        
        if (filters && filters.length > 0) {
          const whereConditions = filters.map(filter => {
            const { field, operator, value } = filter;
            
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
        
        const { data, error } = await supabase.rpc('execute_query', { 
          query_text: sqlQuery 
        });
        
        if (error) {
          console.error("Error running SQL query:", error);
          throw error;
        }
        
        console.log("Query results:", data);
        
        const columns = data && Array.isArray(data) && data.length > 0 
          ? Object.keys(data[0])
          : selectedColumns;
        
        return {
          columns,
          rows: Array.isArray(data) ? data : [],
          total: Array.isArray(data) ? data.length : 0,
          chartConfig
        } as ReportData & { chartConfig?: ChartConfig };
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
    runReportWithJoins
  };
};
