
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Report, ReportFilter, TableInfo, ReportData } from '@/types/reports';
import { useToast } from '@/hooks/use-toast';

export const useReports = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Fetch all reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(report => ({
        ...report,
        fields: Array.isArray(report.selected_fields) ? report.selected_fields : [],
        filters: report.filters ? (report.filters as any[])
          .map((filter: any) => ({
            field: filter.field,
            operator: filter.operator,
            value: filter.value
          })) as ReportFilter[] : []
      })) as Report[];
    }
  });

  // Create a new report
  const createReport = useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'created_at' | 'updated_at'>) => {
      // Convert types for Supabase
      const { data, error } = await supabase
        .from('reports')
        .insert({
          name: report.name,
          description: report.description,
          created_by: report.created_by,
          base_table: report.base_table,
          selected_fields: report.fields,
          filters: JSON.stringify(report.filters || []),
          calculated_fields: JSON.stringify(report.calculated_fields || []),
          group_by: report.group_by ? JSON.stringify(report.group_by) : null,
          aggregation: report.aggregation ? JSON.stringify(report.aggregation) : null,
          visualization: report.visualization ? JSON.stringify(report.visualization) : null,
          schedule: report.schedule ? JSON.stringify(report.schedule) : null,
          export_config: report.export_config ? JSON.stringify(report.export_config) : null,
          template_id: report.template_id || null,
          is_public: report.is_public || false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Report;
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
      
      return {
        ...data,
        fields: Array.isArray(data.selected_fields) ? data.selected_fields : [],
        filters: data.filters ? (data.filters as any[])
          .map((filter: any) => ({
            field: filter.field,
            operator: filter.operator,
            value: filter.value
          })) as ReportFilter[] : []
      } as Report;
    },
    enabled: !!selectedReportId
  });

  // Update a report
  const updateReport = useMutation({
    mutationFn: async ({ id, ...report }: Partial<Report> & { id: string }) => {
      const { data, error } = await supabase
        .from('reports')
        .update({
          name: report.name,
          description: report.description,
          base_table: report.base_table,
          selected_fields: report.fields,
          filters: report.filters ? JSON.stringify(report.filters) : undefined,
          calculated_fields: report.calculated_fields ? JSON.stringify(report.calculated_fields) : undefined,
          group_by: report.group_by ? JSON.stringify(report.group_by) : null,
          aggregation: report.aggregation ? JSON.stringify(report.aggregation) : null,
          visualization: report.visualization ? JSON.stringify(report.visualization) : null,
          schedule: report.schedule ? JSON.stringify(report.schedule) : null,
          export_config: report.export_config ? JSON.stringify(report.export_config) : null,
          template_id: report.template_id,
          is_public: report.is_public
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
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
      const baseTableName = report.base_table;
      const fields = report.selected_fields as string[];
      
      let query = supabase
        .from(baseTableName)
        .select(fields.join(','));
      
      // Apply filters if present
      if (report.filters && Array.isArray(report.filters)) {
        (report.filters as any[]).forEach((filter: any) => {
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
        columns: fields,
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
