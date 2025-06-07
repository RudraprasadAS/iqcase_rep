
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Report, 
  ReportFilter, 
  TableInfo, 
  ReportData, 
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
        
        console.log('Raw reports from DB:', data);
        
        // Transform DB data to match our Report interface
        return data.map(report => {
          // Parse selected_fields
          let fields: string[] = [];
          if (Array.isArray(report.selected_fields)) {
            fields = report.selected_fields.map(f => String(f));
          } else if (typeof report.selected_fields === 'string') {
            try {
              const parsed = JSON.parse(report.selected_fields);
              fields = Array.isArray(parsed) ? parsed.map(f => String(f)) : [];
            } catch {
              fields = [report.selected_fields];
            }
          }

          // Parse filters
          let filters: ReportFilter[] = [];
          if (Array.isArray(report.filters)) {
            filters = report.filters.map((filter: any) => ({
              field: filter.field || '',
              operator: (filter.operator as FilterOperator) || 'eq',
              value: filter.value
            }));
          } else if (typeof report.filters === 'string') {
            try {
              const parsed = JSON.parse(report.filters);
              if (Array.isArray(parsed)) {
                filters = parsed.map((filter: any) => ({
                  field: filter.field || '',
                  operator: (filter.operator as FilterOperator) || 'eq',
                  value: filter.value
                }));
              }
            } catch {
              // Invalid JSON, use empty array
            }
          }

          // Validate chart_type
          const validChartTypes = ['table', 'bar', 'line', 'pie'] as const;
          let chart_type: 'table' | 'bar' | 'line' | 'pie' = 'table';
          if (report.chart_type && validChartTypes.includes(report.chart_type as any)) {
            chart_type = report.chart_type as 'table' | 'bar' | 'line' | 'pie';
          }

          return {
            ...report,
            fields,
            selected_fields: report.selected_fields,
            base_table: report.module,
            filters,
            chart_type,
            joins: []
          } as Report;
        });
      } catch (error) {
        console.error('Error in fetchReports:', error);
        throw error;
      }
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

  // Create a new report
  const createReport = useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'created_at' | 'updated_at'>) => {
      try {
        console.log("Creating report with data:", report);
        
        // Get the current user's ID
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error("Authentication required. Please sign in.");
        }

        // Look up user in our users table
        const { data: userRecord, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (userError) {
          console.error("Error looking up user:", userError);
          throw new Error("Error looking up user record.");
        }

        if (!userRecord) {
          throw new Error("User record not found. Please contact an administrator.");
        }

        // Convert filters to Json format
        const filtersAsJson = report.filters as unknown as Json;
        const fieldsAsJson = report.fields as unknown as Json;

        // Insert the report
        const { data, error } = await supabase
          .from('reports')
          .insert({
            name: report.name,
            description: report.description,
            created_by: userRecord.id,
            module: report.base_table || report.module,
            selected_fields: fieldsAsJson,
            filters: filtersAsJson,
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
        return data;
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
      try {
        console.log("Updating report:", id, report);
        
        // Convert filters to Json format
        const filtersAsJson = report.filters as unknown as Json;
        const fieldsAsJson = report.fields as unknown as Json;
        
        const { data, error } = await supabase
          .from('reports')
          .update({
            name: report.name,
            description: report.description,
            module: report.base_table || report.module,
            selected_fields: fieldsAsJson,
            filters: filtersAsJson,
            aggregation: report.aggregation || null,
            chart_type: report.chart_type || 'table',
            group_by: report.group_by || null,
            is_public: report.is_public
          })
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error("Error updating report:", error);
          throw error;
        }
        
        console.log("Updated report:", data);
        return data;
      } catch (error) {
        console.error("Error in updateReport mutation:", error);
        throw error;
      }
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

  // Run a report
  const runReport = useMutation({
    mutationFn: async (reportId: string) => {
      try {
        console.log('Running report:', reportId);
        
        const { data: report, error: reportError } = await supabase
          .from('reports')
          .select('*')
          .eq('id', reportId)
          .single();
          
        if (reportError) {
          console.error('Error fetching report:', reportError);
          throw reportError;
        }
        
        console.log('Report to run:', report);
        
        const baseTableName = report.module;
        if (!baseTableName) {
          throw new Error('No base table specified in the report');
        }

        // Parse selected_fields
        let selectedFields: string[] = [];
        if (Array.isArray(report.selected_fields)) {
          selectedFields = report.selected_fields.map(f => String(f));
        } else if (typeof report.selected_fields === 'string') {
          try {
            const parsed = JSON.parse(report.selected_fields);
            selectedFields = Array.isArray(parsed) ? parsed.map(f => String(f)) : [];
          } catch {
            selectedFields = [report.selected_fields];
          }
        }

        if (selectedFields.length === 0) {
          selectedFields = ['*'];
        }

        console.log('Running query on table:', baseTableName, 'with fields:', selectedFields);
        
        // Build query
        let query = supabase.from(baseTableName as any);
        
        // Select fields
        if (selectedFields.includes('*')) {
          query = query.select('*');
        } else {
          query = query.select(selectedFields.join(','));
        }

        // Apply filters if present
        if (report.filters && Array.isArray(report.filters)) {
          report.filters.forEach((filter: any) => {
            const { field, operator, value } = filter;
            
            switch (operator) {
              case 'eq':
                query = query.eq(field, value);
                break;
              case 'neq':
                query = query.neq(field, value);
                break;
              case 'gt':
                query = query.gt(field, value);
                break;
              case 'gte':
                query = query.gte(field, value);
                break;
              case 'lt':
                query = query.lt(field, value);
                break;
              case 'lte':
                query = query.lte(field, value);
                break;
              case 'like':
                query = query.like(field, `%${value}%`);
                break;
              case 'ilike':
                query = query.ilike(field, `%${value}%`);
                break;
              case 'in':
                if (Array.isArray(value)) {
                  query = query.in(field, value);
                }
                break;
              case 'is':
                query = query.is(field, value);
                break;
              default:
                break;
            }
          });
        }
        
        const { data, error } = await query.limit(1000);
        
        if (error) {
          console.error("Error running report query:", error);
          throw error;
        }
        
        console.log("Report query results:", data);
        
        return {
          columns: selectedFields.includes('*') ? (data && data.length > 0 ? Object.keys(data[0]) : []) : selectedFields,
          rows: data || [],
          total: data?.length || 0
        } as ReportData;
      } catch (error) {
        console.error("Error in runReport:", error);
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
    runReport
  };
};
