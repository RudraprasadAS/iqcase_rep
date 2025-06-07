
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
      
      // Transform the data to match our Report interface
      return (data || []).map(item => ({
        ...item,
        selected_fields: Array.isArray(item.selected_fields) ? item.selected_fields as string[] : [],
        filters: Array.isArray(item.filters) ? item.filters as ReportFilter[] : []
      })) as Report[];
    }
  });

  // Create report
  const createReport = useMutation({
    mutationFn: async (report: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) throw new Error('User not found');
      
      const { data, error } = await supabase
        .from('reports')
        .insert({
          name: report.name,
          description: report.description,
          table_name: report.table_name,
          selected_fields: report.selected_fields as any,
          filters: report.filters as any,
          created_by: userData.id
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
      const updateData: any = {};
      
      if (report.name !== undefined) updateData.name = report.name;
      if (report.description !== undefined) updateData.description = report.description;
      if (report.table_name !== undefined) updateData.table_name = report.table_name;
      if (report.selected_fields !== undefined) updateData.selected_fields = report.selected_fields;
      if (report.filters !== undefined) updateData.filters = report.filters;
      
      const { data, error } = await supabase
        .from('reports')
        .update(updateData)
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
        p_selected_fields: report.selected_fields as any,
        p_filters: report.filters as any
      });
      
      if (error) throw error;
      
      if (typeof data === 'object' && data !== null && 'error' in data) {
        return { data: [], error: data.error as string };
      }
      
      const resultArray = Array.isArray(data) ? data : (data ? [data] : []);
      return { data: resultArray as Record<string, any>[] };
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
