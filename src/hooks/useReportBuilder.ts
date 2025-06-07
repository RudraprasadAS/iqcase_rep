
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { 
  DataSource, 
  ReportTemplate, 
  ReportConfig, 
  ReportResult,
  DashboardTemplate 
} from '@/types/reports';

export const useReportBuilder = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch available data sources
  const { data: dataSources, isLoading: isLoadingDataSources } = useQuery({
    queryKey: ['dataSources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_sources')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as DataSource[];
    }
  });

  // Fetch table metadata
  const { data: tableMetadata, isLoading: isLoadingMetadata } = useQuery({
    queryKey: ['tableMetadata'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_table_metadata');
      if (error) throw error;
      return data;
    }
  });

  // Fetch report templates
  const { data: reportTemplates, isLoading: isLoadingReports } = useQuery({
    queryKey: ['reportTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReportTemplate[];
    }
  });

  // Create report template
  const createReport = useMutation({
    mutationFn: async (reportData: Omit<ReportTemplate, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!user) throw new Error('User not authenticated');

      const userRecord = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userRecord.error) throw userRecord.error;

      const { data, error } = await supabase
        .from('report_templates')
        .insert({
          ...reportData,
          created_by: userRecord.data.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      toast({
        title: 'Success',
        description: 'Report template created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create report: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Update report template
  const updateReport = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ReportTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('report_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      toast({
        title: 'Success',
        description: 'Report template updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update report: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Delete report template
  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('report_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportTemplates'] });
      toast({
        title: 'Success',
        description: 'Report template deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete report: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Execute report
  const executeReport = useMutation({
    mutationFn: async (config: ReportConfig): Promise<ReportResult> => {
      const { data, error } = await supabase.rpc('execute_dynamic_report', {
        p_config: config
      });

      if (error) throw error;
      
      if (data && typeof data === 'object' && 'error' in data) {
        throw new Error(data.error as string);
      }

      return {
        data: Array.isArray(data) ? data : [],
        total_count: Array.isArray(data) ? data.length : 0
      };
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to execute report: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  return {
    // Data
    dataSources,
    tableMetadata,
    reportTemplates,
    
    // Loading states
    isLoadingDataSources,
    isLoadingMetadata,
    isLoadingReports,
    
    // Mutations
    createReport,
    updateReport,
    deleteReport,
    executeReport,
  };
};
