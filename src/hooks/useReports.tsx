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

  // Get table relationships
  const { data: tableRelationships, isLoading: isLoadingRelationships } = useQuery({
    queryKey: ['tableRelationships'],
    queryFn: async () => {
      try {
        // This would typically be a function in your database to retrieve foreign key relationships
        // For now, we'll define some common relationships manually
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
            base_table: report.module,
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
      // Convert filters for Supabase DB structure
      const filtersForDb = report.filters as unknown as Json;
      
      console.log("Creating report with data:", report);
      console.log("User ID being used:", report.created_by);
      
      try {
        // Get the current user's ID from Auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error("Authentication required. Please sign in.");
        }
        
        console.log("Auth user ID:", authUser.id);
        
        // Convert for Supabase DB structure
        const { data, error } = await supabase
          .from('reports')
          .insert({
            name: report.name,
            description: report.description,
            created_by: authUser.id, // Use the authenticated user ID
            module: report.base_table || report.module, // Support both field names
            selected_fields: report.fields || report.selected_fields, // Support both field names
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
        
        // Parse filters if they're stored as string
        const parsedFilters = typeof data.filters === 'string' 
          ? JSON.parse(data.filters) 
          : data.filters;

        // Process filters to ensure they match ReportFilter type
        const processedFilters = Array.isArray(parsedFilters) 
          ? parsedFilters.map((filter: any) => ({
              field: filter.field,
              operator: filter.operator as FilterOperator,
              value: filter.value
            }))
          : [];
        
        // Map back to our interface
        return {
          ...data,
          fields: Array.isArray(data.selected_fields) ? data.selected_fields as string[] : [],
          selected_fields: data.selected_fields,
          base_table: data.module,
          module: data.module,
          filters: Array.isArray(data.filters) 
            ? data.filters.map((filter: any) => ({
                field: filter.field,
                operator: filter.operator as FilterOperator,
                value: filter.value
              }))
            : []
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

  // Save a custom report view
  const saveCustomView = useMutation({
    mutationFn: async (view: {
      name: string;
      description?: string;
      baseReportId: string;
      columns: string[];
      filters: ReportFilter[];
    }) => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error("Authentication required. Please sign in.");
        }
        
        // Convert ReportFilter to ReportFilterJson for JSON compatibility
        const filtersJson: ReportFilterJson[] = view.filters.map(filter => ({
          field: filter.field,
          operator: filter.operator,
          value: filter.value
        }));
        
        // Create the correct config object
        const configJson: ReportConfigJson = {
          baseReportId: view.baseReportId,
          columns: view.columns,
          filters: filtersJson
        };
        
        const { data, error } = await supabase
          .from('report_configs')
          .insert({
            name: view.name,
            description: view.description,
            created_by: authUser.id,
            target_module: 'report',
            config: configJson as unknown as Json,
            is_public: false
          })
          .select()
          .single();
          
        if (error) {
          throw error;
        }
        
        return data;
      } catch (error) {
        console.error("Error saving custom view:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportConfigs'] });
      toast({
        title: 'View saved',
        description: 'Your custom view has been saved successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save custom view: ${error.message}`
      });
    }
  });

  // Get all saved report views
  const { data: savedViews, isLoading: isLoadingSavedViews } = useQuery({
    queryKey: ['reportConfigs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('report_configs')
          .select('*')
          .eq('target_module', 'report')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        return data.map((view) => {
          // Handle possible string serialization in the database
          const configData = typeof view.config === 'string' 
            ? JSON.parse(view.config) 
            : view.config;
          
          // Safely access properties with type checking
          const baseReport = configData?.baseReportId || '';
          const columns = Array.isArray(configData?.columns) ? configData.columns : [];
          const filtersData = Array.isArray(configData?.filters) ? configData.filters : [];
          
          // Convert filter data to proper ReportFilter objects
          const filters = filtersData.map((f: any) => ({
            field: f.field || '',
            operator: (f.operator as FilterOperator) || 'eq',
            value: f.value
          }));
          
          return {
            id: view.id,
            name: view.name,
            description: view.description,
            baseReport,
            columns,
            filters,
            created_by: view.created_by,
            created_at: view.created_at
          };
        });
        
      } catch (error) {
        console.error('Error fetching saved views:', error);
        throw error;
      }
    }
  });

  // Get a single report
  const { data: selectedReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ['reports', selectedReportId],
    queryFn: async () => {
      if (!selectedReportId) return null;
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', selectedReportId)
        .single();
      
      if (error) throw error;
      
      // Parse filters if they're stored as string
      const parsedFilters = typeof data.filters === 'string' 
        ? JSON.parse(data.filters) 
        : data.filters;

      // Process filters to ensure they match ReportFilter type
      const processedFilters = Array.isArray(parsedFilters) 
        ? parsedFilters.map((filter: any) => ({
            field: filter.field,
            operator: filter.operator as FilterOperator,
            value: filter.value
          })) as ReportFilter[]
        : [];
      
      // Map DB structure to our interface
      return {
        ...data,
        fields: Array.isArray(data.selected_fields) ? data.selected_fields as string[] : [],
        selected_fields: data.selected_fields,
        base_table: data.module,
        module: data.module,
        filters: processedFilters
      } as Report;
    },
    enabled: !!selectedReportId
  });

  // Update a report
  const updateReport = useMutation({
    mutationFn: async ({ id, ...report }: Partial<Report> & { id: string }) => {
      // Convert filters to the format expected by the database
      const filtersForDb = report.filters as unknown as Json;
      
      // Convert for Supabase DB structure
      const { data, error } = await supabase
        .from('reports')
        .update({
          name: report.name,
          description: report.description,
          module: report.base_table || report.module, // Support both field names
          selected_fields: report.fields || report.selected_fields, // Support both field names
          filters: filtersForDb,
          aggregation: report.aggregation || null,
          chart_type: report.chart_type || 'table',
          group_by: report.group_by || null,
          is_public: report.is_public
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Parse filters if they're stored as string
      const parsedFilters = typeof data.filters === 'string' 
        ? JSON.parse(data.filters) 
        : data.filters;

      // Process filters to ensure they match ReportFilter type
      const processedFilters = Array.isArray(parsedFilters) 
        ? parsedFilters.map((filter: any) => ({
            field: filter.field,
            operator: filter.operator as FilterOperator,
            value: filter.value
          })) as ReportFilter[]
        : [];
      
      // Map back to our interface
      return {
        ...data,
        fields: Array.isArray(data.selected_fields) ? data.selected_fields as string[] : [],
        selected_fields: data.selected_fields,
        base_table: data.module,
        module: data.module,
        filters: processedFilters
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

  // Delete a saved view
  const deleteSavedView = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_configs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportConfigs'] });
      toast({
        title: 'View deleted',
        description: 'The custom view has been deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete view: ${error.message}`
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
        
        // Enhance table info with relationship data
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

  // Function to get related tables for a given base table
  const getRelatedTables = (baseTable: string) => {
    if (!tableRelationships) return [];
    
    return tableRelationships
      .filter(rel => rel.sourceTable === baseTable)
      .map(rel => ({
        name: rel.targetTable,
        sourceColumn: rel.sourceColumn,
        targetColumn: rel.targetColumn
      }));
  };

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
        
        // Start building the SQL query with selected columns
        let columnsToSelect = selectedColumns.map(col => {
          // Check if the column includes a table alias (e.g., 'users.name')
          if (col.includes('.')) {
            const [alias, field] = col.split('.');
            return `${alias}.${field}`;
          }
          return `${baseTable}.${col}`;
        }).join(', ');
        
        // If no columns were explicitly selected, select all from base table
        if (!columnsToSelect) {
          columnsToSelect = `${baseTable}.*`;
        }
        
        let sqlQuery = `
          SELECT ${columnsToSelect}
          FROM ${baseTable}
        `;
        
        // Add joins if specified
        if (joins && joins.length > 0) {
          joins.forEach(join => {
            const joinType = join.joinType.toUpperCase();
            const alias = join.alias || join.table;
            
            sqlQuery += `
              ${joinType} JOIN ${join.table} AS ${alias}
              ON ${baseTable}.${join.sourceColumn} = ${alias}.${join.targetColumn}
            `;
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
        
        // Use type assertion to access the execute_query function
        const { data, error } = await (supabase.rpc as any)('execute_query', { 
          query_text: sqlQuery 
        });
        
        if (error) {
          console.error("Error running SQL query:", error);
          throw error;
        }
        
        console.log("Query results:", data);
        
        // Extract column names from the first result
        const columns = data && data.length > 0 
          ? Object.keys(data[0])
          : selectedColumns;
        
        return {
          columns,
          rows: data || [],
          total: data?.length || 0
        } as ReportData;
      } catch (error) {
        console.error("Error in runReportWithJoins:", error);
        throw error;
      }
    }
  });

  // Run a report
  const runReport = useMutation({
    mutationFn: async (reportId: string) => {
      try {
        const { data: report, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();
          
        if (reportError) throw reportError;
        
        // Run the query based on report configuration
        const baseTableName = report.module; // Use module as base_table
        const selectedFields = Array.isArray(report.selected_fields) ? report.selected_fields as string[] : [];
        
        if (!baseTableName) {
          throw new Error('No base table specified in the report');
        }
        
        console.log(`Running report on table: ${baseTableName} with fields:`, selectedFields);
        
        // Use a type assertion to handle dynamic table names
        // This addresses the TypeScript error by asserting the type
        const query = (supabase.from(baseTableName as any) as any)
          .select(selectedFields.join(','));
        
        // Parse filters if they're stored as string
        const parsedFilters = typeof report.filters === 'string' 
          ? JSON.parse(report.filters) 
          : report.filters;
        
        // Apply filters if present
        if (parsedFilters && Array.isArray(parsedFilters)) {
          parsedFilters.forEach((filter: any) => {
            const { field, operator, value } = filter;
            
            switch (operator) {
              case 'eq':
                query.eq(field, value);
                break;
              case 'neq':
                query.neq(field, value);
                break;
              case 'gt':
                query.gt(field, value);
                break;
              case 'gte':
                query.gte(field, value);
                break;
              case 'lt':
                query.lt(field, value);
                break;
              case 'lte':
                query.lte(field, value);
                break;
              case 'like':
                query.like(field, `%${value}%`);
                break;
              case 'ilike':
                query.ilike(field, `%${value}%`);
                break;
              case 'in':
                if (Array.isArray(value)) {
                  query.in(field, value);
                }
                break;
              case 'is':
                query.is(field, value);
                break;
              default:
                break;
            }
          });
        }
        
        const { data, error, count } = await query.limit(1000);
        
        if (error) {
          console.error("Error running report query:", error);
          throw error;
        }
        
        console.log("Report query results:", data, "Count:", count);
        
        return {
          columns: selectedFields,
          rows: data || [],
          total: count || 0
        } as ReportData;
      } catch (error) {
        console.error("Error in runReport:", error);
        throw error;
      }
    }
  });

  return {
    reports,
    selectedReport,
    savedViews,
    tables,
    isLoadingReports,
    isLoadingReport,
    isLoadingTables,
    isLoadingSavedViews,
    setSelectedReportId,
    createReport,
    updateReport,
    deleteReport,
    saveCustomView,
    deleteSavedView,
    runReport,
    runReportWithJoins,
    getRelatedTables
  };
};
