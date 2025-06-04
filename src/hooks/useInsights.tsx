
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  DataSource, 
  InsightReport, 
  InsightDashboard, 
  DashboardWidget,
  ReportExecution,
  InsightFilter,
  Aggregation,
  GroupBy,
  ChartConfig
} from '@/types/insights';

export const useInsights = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);

  // Fetch data sources
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

  // Fetch reports
  const { data: reports, isLoading: isLoadingReports } = useQuery({
    queryKey: ['insightReports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insight_reports')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InsightReport[];
    }
  });

  // Fetch dashboards
  const { data: dashboards, isLoading: isLoadingDashboards } = useQuery({
    queryKey: ['insightDashboards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insight_dashboards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InsightDashboard[];
    }
  });

  // Get a single report
  const { data: selectedReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ['insightReports', selectedReportId],
    queryFn: async () => {
      if (!selectedReportId) return null;
      
      const { data, error } = await supabase
        .from('insight_reports')
        .select('*')
        .eq('id', selectedReportId)
        .single();
      
      if (error) throw error;
      return data as InsightReport;
    },
    enabled: !!selectedReportId
  });

  // Get a single dashboard
  const { data: selectedDashboard, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['insightDashboards', selectedDashboardId],
    queryFn: async () => {
      if (!selectedDashboardId) return null;
      
      const { data, error } = await supabase
        .from('insight_dashboards')
        .select(`
          *,
          widgets:insight_widgets(*)
        `)
        .eq('id', selectedDashboardId)
        .single();
      
      if (error) throw error;
      return data as InsightDashboard & { widgets: DashboardWidget[] };
    },
    enabled: !!selectedDashboardId
  });

  // Execute a report query
  const executeReport = useMutation({
    mutationFn: async ({
      dataSourceName,
      selectedFields,
      filters = [],
      groupBy = [],
      aggregations = []
    }: {
      dataSourceName: string;
      selectedFields: any[];
      filters?: InsightFilter[];
      groupBy?: GroupBy[];
      aggregations?: Aggregation[];
    }) => {
      const { data, error } = await supabase.rpc('execute_insight_query', {
        data_source_name: dataSourceName,
        selected_fields: selectedFields,
        filters: filters,
        group_by_fields: groupBy,
        aggregations: aggregations,
        limit_count: 1000
      });

      if (error) throw error;
      
      // Extract column names from the first result
      const columns = data && Array.isArray(data) && data.length > 0 
        ? Object.keys(data[0])
        : selectedFields.map(f => f.name);
      
      return {
        columns,
        rows: Array.isArray(data) ? data : [],
        total: Array.isArray(data) ? data.length : 0
      } as ReportExecution;
    }
  });

  // Create a new report
  const createReport = useMutation({
    mutationFn: async (report: Omit<InsightReport, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('insight_reports')
        .insert({
          ...report,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as InsightReport;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insightReports'] });
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
    mutationFn: async ({ id, ...report }: Partial<InsightReport> & { id: string }) => {
      const { data, error } = await supabase
        .from('insight_reports')
        .update(report)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as InsightReport;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['insightReports'] });
      queryClient.invalidateQueries({ queryKey: ['insightReports', variables.id] });
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
        .from('insight_reports')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['insightReports'] });
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

  // Create a new dashboard
  const createDashboard = useMutation({
    mutationFn: async (dashboard: Omit<InsightDashboard, 'id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('insight_dashboards')
        .insert({
          ...dashboard,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as InsightDashboard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insightDashboards'] });
      toast({
        title: 'Dashboard created',
        description: 'Your dashboard has been created successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to create dashboard: ${error.message}`
      });
    }
  });

  // Add widget to dashboard
  const addWidget = useMutation({
    mutationFn: async (widget: Omit<DashboardWidget, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('insight_widgets')
        .insert(widget)
        .select()
        .single();
      
      if (error) throw error;
      return data as DashboardWidget;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['insightDashboards'] });
      queryClient.invalidateQueries({ queryKey: ['insightDashboards', variables.dashboard_id] });
      toast({
        title: 'Widget added',
        description: 'Widget has been added to the dashboard'
      });
    }
  });

  return {
    dataSources,
    reports,
    dashboards,
    selectedReport,
    selectedDashboard,
    isLoadingDataSources,
    isLoadingReports,
    isLoadingDashboards,
    isLoadingReport,
    isLoadingDashboard,
    setSelectedReportId,
    setSelectedDashboardId,
    executeReport,
    createReport,
    updateReport,
    deleteReport,
    createDashboard,
    addWidget
  };
};
