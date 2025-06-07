
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
      return data as unknown as DataSource[];
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
      return data as unknown as ReportTemplate[];
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
          config: reportData.config as any,
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
      const updateData = {
        ...updates,
        ...(updates.config && { config: updates.config as any })
      };
      
      const { data, error } = await supabase
        .from('report_templates')
        .update(updateData)
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

  // Execute report - simplified to avoid SQL identifier issues
  const executeReport = useMutation({
    mutationFn: async (config: ReportConfig): Promise<ReportResult> => {
      // Validate that we have a valid base table selection from the report builder
      if (!config.selected_fields || config.selected_fields.length === 0) {
        throw new Error('No fields selected for the report');
      }

      // Build a simple query to avoid SQL identifier issues
      const baseTable = config.selected_fields[0]?.table;
      if (!baseTable) {
        throw new Error('No base table found');
      }

      // Validate base table name to prevent injection
      const allowedTables = ['cases', 'users', 'case_activities', 'case_messages', 'case_feedback', 'notifications'];
      if (!allowedTables.includes(baseTable)) {
        throw new Error('Invalid table name');
      }

      // For now, just do a simple select to get data working
      const { data, error } = await supabase
        .from(baseTable as any)
        .select('*')
        .limit(100);

      if (error) throw error;

      return {
        data: data || [],
        total_count: data?.length || 0
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
