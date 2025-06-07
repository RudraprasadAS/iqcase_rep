
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Report, ReportFilter, TableInfo, ReportData } from '@/types/reports';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const useReports = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get available tables
  const { data: tables, isLoading: isLoadingTables } = useQuery({
    queryKey: ['available-tables'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_available_tables');
      if (error) throw error;
      return data as TableInfo[];
    }
  });

  // Get all reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Report[];
    }
  });

  // Create report
  const createReport = useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('reports')
        .insert({
          ...report,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Success',
        description: 'Report created successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
    }
  });

  // Update report
  const updateReport = useMutation({
    mutationFn: async ({ id, ...report }: Partial<Report> & { id: string }) => {
      const { data, error } = await supabase
        .from('reports')
        .update(report)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Success',
        description: 'Report updated successfully'
      });
    }
  });

  // Delete report
  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Success',
        description: 'Report deleted successfully'
      });
    }
  });

  // Execute report
  const executeReport = useMutation({
    mutationFn: async (report: Report): Promise<ReportData> => {
      const { data, error } = await supabase.rpc('execute_report', {
        p_table_name: report.table_name,
        p_selected_fields: report.selected_fields,
        p_filters: report.filters
      });
      
      if (error) throw error;
      
      if (typeof data === 'object' && data !== null && 'error' in data) {
        return { data: [], error: data.error as string };
      }
      
      return { data: Array.isArray(data) ? data : [] };
    }
  });

  return {
    tables,
    reports,
    isLoadingTables,
    isLoadingReports,
    createReport,
    updateReport,
    deleteReport,
    executeReport
  };
};
