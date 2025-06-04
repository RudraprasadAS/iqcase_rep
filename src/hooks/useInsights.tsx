
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
      
      // Cast the Json types to our proper types
      return data.map(item => ({
        ...item,
        fields: item.fields as any,
        relationships: item.relationships as any
      })) as DataSource[];
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
      
      // Cast the Json types to our proper types
      return data.map(item => ({
        ...item,
        selected_fields: item.selected_fields as string[],
        calculated_fields: item.calculated_fields as any,
        filters: item.filters as any,
        group_by: item.group_by as any,
        aggregations: item.aggregations as any,
        chart_config: item.chart_config as any
      })) as InsightReport[];
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
      
      // Cast the Json types to our proper types
      return data.map(item => ({
        ...item,
        layout_config: item.layout_config as any,
        filters: item.filters as any
      })) as InsightDashboard[];
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
      
      // Cast the Json types to our proper types
      return {
        ...data,
        selected_fields: data.selected_fields as string[],
        calculated_fields: data.calculated_fields as any,
        filters: data.filters as any,
        group_by: data.group_by as any,
        aggregations: data.aggregations as any,
        chart_config: data.chart_config as any
      } as InsightReport;
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
      
      // Cast the Json types to our proper types
      return {
        ...data,
        layout_config: data.layout_config as any,
        filters: data.filters as any,
        widgets: data.widgets as DashboardWidget[]
      } as InsightDashboard & { widgets: DashboardWidget[] };
    },
    enabled: !!selectedDashboardId
  });

  // Execute a report query with proper relational field handling
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
      console.log('Executing report with:', { dataSourceName, selectedFields, filters });
      
      // Find the data source
      const dataSource = dataSources?.find(ds => ds.name === dataSourceName);
      if (!dataSource) {
        throw new Error('Data source not found');
      }

      // Build SQL query with proper joins
      let baseTable = dataSource.table_name;
      let selectFields: string[] = [];
      let joins: string[] = [];
      let usedTables = new Set([baseTable]);

      // Process selected fields and build joins
      selectedFields.forEach(field => {
        const fieldName = field.name || field;
        
        if (fieldName.includes('.')) {
          // This is a related field (e.g., "submitted_user.name")
          const [tableAlias, columnName] = fieldName.split('.');
          
          // Find the relationship
          const relationship = dataSource.relationships.find(rel => 
            rel.label === tableAlias || rel.table === tableAlias
          );
          
          if (relationship && !usedTables.has(relationship.table)) {
            joins.push(`LEFT JOIN ${relationship.table} AS ${tableAlias} ON ${baseTable}.${relationship.field} = ${tableAlias}.${relationship.target_field}`);
            usedTables.add(relationship.table);
          }
          
          selectFields.push(`${tableAlias}.${columnName} AS "${fieldName}"`);
        } else {
          // Base table field
          selectFields.push(`${baseTable}.${fieldName}`);
        }
      });

      // Build WHERE clause
      let whereConditions: string[] = [];
      filters.forEach(filter => {
        const fieldName = filter.field;
        let actualField = fieldName;
        
        if (fieldName.includes('.')) {
          // Related field
          actualField = fieldName;
        } else {
          // Base table field
          actualField = `${baseTable}.${fieldName}`;
        }
        
        switch (filter.operator) {
          case 'eq':
            whereConditions.push(`${actualField} = '${filter.value}'`);
            break;
          case 'neq':
            whereConditions.push(`${actualField} != '${filter.value}'`);
            break;
          case 'gt':
            whereConditions.push(`${actualField} > '${filter.value}'`);
            break;
          case 'gte':
            whereConditions.push(`${actualField} >= '${filter.value}'`);
            break;
          case 'lt':
            whereConditions.push(`${actualField} < '${filter.value}'`);
            break;
          case 'lte':
            whereConditions.push(`${actualField} <= '${filter.value}'`);
            break;
          case 'like':
            whereConditions.push(`${actualField} ILIKE '%${filter.value}%'`);
            break;
        }
      });

      // Construct final query
      let query = `SELECT ${selectFields.length > 0 ? selectFields.join(', ') : '*'} FROM ${baseTable}`;
      
      if (joins.length > 0) {
        query += ' ' + joins.join(' ');
      }
      
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      query += ' LIMIT 1000';
      
      console.log('Generated SQL query:', query);

      // Execute the query
      const { data, error } = await supabase.rpc('execute_query', {
        query_text: query
      });

      if (error) {
        console.error('Query execution error:', error);
        throw error;
      }
      
      console.log('Query result:', data);
      
      // Parse the result
      const rows = Array.isArray(data) ? data : [];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : selectedFields.map(f => f.name || f);
      
      return {
        columns,
        rows,
        total: rows.length
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
          created_by: user.id,
          // Cast our types to Json for Supabase
          selected_fields: report.selected_fields as any,
          calculated_fields: report.calculated_fields as any,
          filters: report.filters as any,
          group_by: report.group_by as any,
          aggregations: report.aggregations as any,
          chart_config: report.chart_config as any
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        selected_fields: data.selected_fields as string[],
        calculated_fields: data.calculated_fields as any,
        filters: data.filters as any,
        group_by: data.group_by as any,
        aggregations: data.aggregations as any,
        chart_config: data.chart_config as any
      } as InsightReport;
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
      const updateData: any = { ...report };
      
      // Convert our types to Json for Supabase if they exist
      if (report.selected_fields) updateData.selected_fields = report.selected_fields as any;
      if (report.calculated_fields) updateData.calculated_fields = report.calculated_fields as any;
      if (report.filters) updateData.filters = report.filters as any;
      if (report.group_by) updateData.group_by = report.group_by as any;
      if (report.aggregations) updateData.aggregations = report.aggregations as any;
      if (report.chart_config) updateData.chart_config = report.chart_config as any;
      
      const { data, error } = await supabase
        .from('insight_reports')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        selected_fields: data.selected_fields as string[],
        calculated_fields: data.calculated_fields as any,
        filters: data.filters as any,
        group_by: data.group_by as any,
        aggregations: data.aggregations as any,
        chart_config: data.chart_config as any
      } as InsightReport;
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
          created_by: user.id,
          // Cast our types to Json for Supabase
          layout_config: dashboard.layout_config as any,
          filters: dashboard.filters as any
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        layout_config: data.layout_config as any,
        filters: data.filters as any
      } as InsightDashboard;
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
        .insert({
          ...widget,
          config: widget.config as any,
          position: widget.position as any
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        ...data,
        config: data.config as any,
        position: data.position as any
      } as DashboardWidget;
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
