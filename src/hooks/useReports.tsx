
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Report, ReportFilter, TableInfo, ReportData, FilterOperator } from '@/types/reports';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export const useReports = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Helper function to process filters
  const processFilters = (filters: any): ReportFilter[] => {
    if (!filters) return [];
    
    const parsedFilters = typeof filters === 'string' 
      ? JSON.parse(filters) 
      : filters;
    
    if (!Array.isArray(parsedFilters)) return [];
    
    return parsedFilters.map((filter: any) => ({
      field: filter.field,
      operator: filter.operator as FilterOperator,
      value: filter.value
    }));
  };

  // Helper function to map DB report to our interface
  const mapDbReportToInterface = (report: any): Report => {
    return {
      ...report,
      fields: Array.isArray(report.selected_fields) 
        ? report.selected_fields as string[] 
        : [],
      selected_fields: report.selected_fields,
      base_table: report.module,
      module: report.module,
      filters: processFilters(report.filters)
    } as Report;
  };

  // Fetch all reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map DB structure to our interface
      return data.map(report => mapDbReportToInterface(report));
    }
  });

  // Create a new report
  const createReport = useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'created_at' | 'updated_at'>) => {
      // Prepare the data for the database
      const reportForDb = {
        name: report.name,
        description: report.description,
        created_by: report.created_by,
        module: report.base_table || report.module, // Support both field names
        selected_fields: report.fields || report.selected_fields, // Support both field names
        filters: report.filters as unknown as Json,
        aggregation: report.aggregation || null,
        chart_type: report.chart_type || 'table',
        group_by: report.group_by || null,
        is_public: report.is_public || false
      };
      
      const { data, error } = await supabase
        .from('reports')
        .insert(reportForDb)
        .select()
        .single();
      
      if (error) throw error;
      
      // Map back to our interface
      return mapDbReportToInterface(data);
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
      
      // Map DB structure to our interface
      return mapDbReportToInterface(data);
    },
    enabled: !!selectedReportId
  });

  // Update a report
  const updateReport = useMutation({
    mutationFn: async ({ id, ...report }: Partial<Report> & { id: string }) => {
      // Prepare the data for the database
      const reportForDb = {
        name: report.name,
        description: report.description,
        module: report.base_table || report.module, // Support both field names
        selected_fields: report.fields || report.selected_fields, // Support both field names
        filters: report.filters as unknown as Json,
        aggregation: report.aggregation || null,
        chart_type: report.chart_type || 'table',
        group_by: report.group_by || null,
        is_public: report.is_public
      };
      
      const { data, error } = await supabase
        .from('reports')
        .update(reportForDb)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Map back to our interface
      return mapDbReportToInterface(data);
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
      const { data, error } = await supabase.rpc('get_tables_info');
      
      if (error) throw error;
      return data as TableInfo[];
    }
  });

  // Run a report
  const runReport = useMutation({
    mutationFn: async (reportId: string) => {
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();
        
      if (reportError) throw reportError;
      
      // Run the query based on report configuration
      const baseTableName = report.module; // Use module as base_table
      const selectedFields = Array.isArray(report.selected_fields) ? report.selected_fields as string[] : [];
      
      // Verify that the table exists before querying it
      if (!baseTableName) {
        throw new Error('No base table specified in the report');
      }
      
      // Use type assertion to handle the dynamic table name
      let query = supabase
        .from(baseTableName as any)
        .select(selectedFields.join(','));
      
      // Apply filters if present
      const filters = processFilters(report.filters);
      
      if (filters.length > 0) {
        filters.forEach((filter) => {
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
      
      const { data, error, count } = await query.limit(1000);
      
      if (error) throw error;
      
      return {
        columns: selectedFields,
        rows: data || [],
        total: count || 0
      } as ReportData;
    }
  });

  return {
    reports,
    selectedReport,
    tables,
    isLoadingReports,
    isLoadingReport,
    isLoadingTables,
    setSelectedReportId,
    createReport,
    updateReport,
    deleteReport,
    runReport
  };
};
