
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface SimpleReport {
  id: string;
  name: string;
  description?: string;
  module: string;
  base_table: string;
  selected_fields: any[];
  filters: any[];
  chart_type: string;
  is_public: boolean;
  created_at: string;
  created_by: string;
}

export const useSimpleReports = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch all reports using RPC to avoid TypeScript issues
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['simpleReports'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('execute_query', {
          query_text: 'SELECT * FROM reports ORDER BY created_at DESC'
        });
        
        if (error) throw error;
        return Array.isArray(data) ? data as SimpleReport[] : [];
      } catch (error) {
        console.error('Error fetching reports:', error);
        throw error;
      }
    }
  });

  // Get available tables
  const { data: tables, isLoading: isLoadingTables } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.rpc('get_tables_info');
        
        if (error) throw error;
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching tables:', error);
        throw error;
      }
    }
  });

  // Create a new report
  const createReport = useMutation({
    mutationFn: async (report: Omit<SimpleReport, 'id' | 'created_at'>) => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          throw new Error("Authentication required. Please sign in.");
        }
        
        // Get the user's ID from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .single();
        
        if (userError || !userData) {
          throw new Error("User not found. Please contact an administrator.");
        }
        
        const { data, error } = await supabase.rpc('execute_query', {
          query_text: `
            INSERT INTO reports (name, description, module, base_table, selected_fields, filters, chart_type, is_public, created_by)
            VALUES ('${report.name}', '${report.description || ''}', '${report.module}', '${report.base_table}', 
                   '${JSON.stringify(report.selected_fields)}', '${JSON.stringify(report.filters)}', 
                   '${report.chart_type}', ${report.is_public}, '${userData.id}')
            RETURNING *
          `
        });
        
        if (error) throw error;
        return Array.isArray(data) ? data[0] : data;
      } catch (error) {
        console.error("Error creating report:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simpleReports'] });
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
    mutationFn: async ({ id, ...report }: Partial<SimpleReport> & { id: string }) => {
      try {
        const { data, error } = await supabase.rpc('execute_query', {
          query_text: `
            UPDATE reports 
            SET name = '${report.name}', 
                description = '${report.description || ''}',
                module = '${report.module}',
                base_table = '${report.base_table}',
                selected_fields = '${JSON.stringify(report.selected_fields)}',
                filters = '${JSON.stringify(report.filters)}',
                chart_type = '${report.chart_type}',
                is_public = ${report.is_public},
                updated_at = now()
            WHERE id = '${id}'
            RETURNING *
          `
        });
        
        if (error) throw error;
        return Array.isArray(data) ? data[0] : data;
      } catch (error) {
        console.error("Error updating report:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simpleReports'] });
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
      try {
        const { error } = await supabase.rpc('execute_query', {
          query_text: `DELETE FROM reports WHERE id = '${id}'`
        });
        
        if (error) throw error;
        return id;
      } catch (error) {
        console.error("Error deleting report:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simpleReports'] });
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

  return {
    reports,
    tables,
    isLoadingReports,
    isLoadingTables,
    createReport,
    updateReport,
    deleteReport
  };
};
