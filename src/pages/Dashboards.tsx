import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Edit, Trash2, Settings, BarChart3, Calculator, PieChart, TrendingUp } from 'lucide-react';
import { DashboardBuilder } from '@/components/dashboards/DashboardBuilder';
import { ResizableDashboard } from '@/components/dashboards/ResizableDashboard';
import { useReports } from '@/hooks/useReports';
import { useToast } from '@/hooks/use-toast';
import { ReportPreview } from '@/components/reports/ReportPreview';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardItem {
  id: string;
  type: 'report' | 'metric' | 'chart';
  title: string;
  reportId?: string;
  metric?: {
    table: string;
    field: string;
    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
  };
  position: { x: number; y: number; width: number; height: number };
}

interface SavedDashboard {
  id: string;
  name: string;
  items: DashboardItem[];
  createdAt: string;
  createdBy?: string;
  isPublic?: boolean;
}

const Dashboards = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { reports, runReportWithJoins, isLoadingReports } = useReports();
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<SavedDashboard | null>(null);
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboard[]>([]);
  const [viewingDashboard, setViewingDashboard] = useState<SavedDashboard | null>(null);
  const [dashboardData, setDashboardData] = useState<Record<string, any[]>>({});
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Get current user role for RBAC
  useEffect(() => {
    const getCurrentUserRole = async () => {
      try {
        const { data } = await supabase.rpc('get_current_user_info');
        if (data && data.length > 0) {
          setCurrentUserRole(data[0].role_name || '');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    if (user) {
      getCurrentUserRole();
    }
  }, [user]);

  // Load dashboards from localStorage on component mount with RBAC filtering
  useEffect(() => {
    const loadDashboards = () => {
      try {
        const saved = localStorage.getItem('savedDashboards');
        if (saved) {
          const dashboards = JSON.parse(saved) as SavedDashboard[];
          
          // Apply RBAC filtering - only show dashboards user can access
          const filteredDashboards = dashboards.filter(dashboard => {
            // Admins can see all dashboards
            if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
              return true;
            }
            
            // Users can see public dashboards or dashboards they created
            return dashboard.isPublic === true || dashboard.createdBy === user?.id;
          });
          
          setSavedDashboards(filteredDashboards);
        }
      } catch (error) {
        console.error('Error loading dashboards from localStorage:', error);
      }
    };

    if (currentUserRole) {
      loadDashboards();
    }
  }, [currentUserRole, user?.id]);

  // Save dashboards to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('savedDashboards', JSON.stringify(savedDashboards));
    } catch (error) {
      console.error('Error saving dashboards to localStorage:', error);
    }
  }, [savedDashboards]);

  const handleSaveDashboard = (dashboardName: string, items: DashboardItem[], isPublic: boolean = false) => {
    if (editingDashboard) {
      // Update existing dashboard - check permissions
      if (editingDashboard.createdBy !== user?.id && currentUserRole !== 'admin') {
        toast({
          title: "Access denied",
          description: "You can only edit dashboards you created.",
          variant: "destructive"
        });
        return;
      }
      
      setSavedDashboards(dashboards => 
        dashboards.map(d => 
          d.id === editingDashboard.id 
            ? { ...d, name: dashboardName, items, isPublic }
            : d
        )
      );
      setEditingDashboard(null);
    } else {
      // Create new dashboard
      const newDashboard: SavedDashboard = {
        id: Date.now().toString(),
        name: dashboardName,
        items: items,
        createdAt: new Date().toISOString(),
        createdBy: user?.id,
        isPublic
      };
      setSavedDashboards(prev => [...prev, newDashboard]);
    }
    
    setShowBuilder(false);
    toast({
      title: "Dashboard saved",
      description: `Dashboard "${dashboardName}" has been saved successfully`
    });
  };

  const loadMetricData = async (item: DashboardItem): Promise<any[]> => {
    if (!item.metric) return [];
    
    try {
      const { table, field, aggregation } = item.metric;
      
      // Build SQL query for metric calculation
      let query = '';
      if (aggregation === 'count') {
        query = `SELECT COUNT(*) as value FROM ${table}`;
      } else if (field !== '*') {
        switch (aggregation) {
          case 'sum':
            query = `SELECT SUM(${field}) as value FROM ${table}`;
            break;
          case 'avg':
            query = `SELECT AVG(${field}) as value FROM ${table}`;
            break;
          case 'min':
            query = `SELECT MIN(${field}) as value FROM ${table}`;
            break;
          case 'max':
            query = `SELECT MAX(${field}) as value FROM ${table}`;
            break;
          default:
            query = `SELECT COUNT(*) as value FROM ${table}`;
        }
      } else {
        query = `SELECT COUNT(*) as value FROM ${table}`;
      }

      console.log('Executing metric query:', query);
      
      const { data, error } = await supabase.rpc('execute_query', { 
        query_text: query 
      });
      
      if (error) {
        console.error('Error executing metric query:', error);
        return [{ value: 0 }];
      }
      
      return Array.isArray(data) && data.length > 0 ? data : [{ value: 0 }];
    } catch (error) {
      console.error('Error loading metric data:', error);
      return [{ value: 0 }];
    }
  };

  const loadDashboardData = async (dashboard: SavedDashboard) => {
    const newDashboardData: Record<string, any[]> = {};

    for (const item of dashboard.items) {
      setLoadingItems(prev => new Set([...prev, item.id]));

      try {
        if (item.type === 'report' && item.reportId) {
          const report = reports?.find(r => r.id === item.reportId);
          if (report) {
            const result = await runReportWithJoins.mutateAsync({
              baseTable: report.base_table,
              selectedColumns: Array.isArray(report.selected_fields) ? report.selected_fields.map(f => String(f)) : [],
              filters: Array.isArray(report.filters) ? report.filters : []
            });
            
            newDashboardData[item.id] = result.rows || [];
          }
        } else if (item.type === 'metric') {
          // Load actual metric data from database
          const metricData = await loadMetricData(item);
          newDashboardData[item.id] = metricData;
        }
      } catch (error) {
        console.error(`Error loading data for item ${item.id}:`, error);
        newDashboardData[item.id] = item.type === 'metric' ? [{ value: 0 }] : [];
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: `Failed to load data for "${item.title}"`
        });
      } finally {
        setLoadingItems(prev => {
          const updated = new Set(prev);
          updated.delete(item.id);
          return updated;
        });
      }
    }

    setDashboardData(newDashboardData);
  };

  const handleViewDashboard = async (dashboard: SavedDashboard) => {
    // Check access permissions
    const canAccess = dashboard.isPublic || 
                     dashboard.createdBy === user?.id || 
                     currentUserRole === 'admin' || 
                     currentUserRole === 'super_admin';
    
    if (!canAccess) {
      toast({
        title: "Access denied",
        description: "You don't have permission to view this dashboard.",
        variant: "destructive"
      });
      return;
    }
    
    setViewingDashboard(dashboard);
    await loadDashboardData(dashboard);
  };

  const handleEditDashboard = (dashboard: SavedDashboard) => {
    // Check edit permissions
    const canEdit = dashboard.createdBy === user?.id || 
                   currentUserRole === 'admin' || 
                   currentUserRole === 'super_admin';
    
    if (!canEdit) {
      toast({
        title: "Access denied",
        description: "You can only edit dashboards you created.",
        variant: "destructive"
      });
      return;
    }
    
    setEditingDashboard(dashboard);
    setShowBuilder(true);
    setViewingDashboard(null);
  };

  const handleDeleteDashboard = (dashboardId: string) => {
    const dashboard = savedDashboards.find(d => d.id === dashboardId);
    
    // Check delete permissions
    const canDelete = dashboard?.createdBy === user?.id || 
                     currentUserRole === 'admin' || 
                     currentUserRole === 'super_admin';
    
    if (!canDelete) {
      toast({
        title: "Access denied",
        description: "You can only delete dashboards you created.",
        variant: "destructive"
      });
      return;
    }
    
    setSavedDashboards(dashboards => dashboards.filter(d => d.id !== dashboardId));
    if (viewingDashboard?.id === dashboardId) {
      setViewingDashboard(null);
    }
    toast({
      title: "Dashboard deleted",
      description: "Dashboard has been deleted successfully"
    });
  };

  const handleCreateNew = () => {
    setEditingDashboard(null);
    setShowBuilder(true);
    setViewingDashboard(null);
  };

  const handleBackToDashboards = () => {
    setShowBuilder(false);
    setEditingDashboard(null);
    setViewingDashboard(null);
  };

  const refreshDashboard = async () => {
    if (viewingDashboard) {
      await loadDashboardData(viewingDashboard);
      toast({
        title: "Dashboard refreshed",
        description: "Dashboard data has been updated"
      });
    }
  };

  const renderDashboardItem = (item: DashboardItem) => {
    const isLoading = loadingItems.has(item.id);
    const data = dashboardData[item.id] || [];
    const report = item.reportId ? reports?.find(r => r.id === item.reportId) : null;

    return (
      <Card key={item.id} className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {item.type === 'report' && <BarChart3 className="h-4 w-4" />}
            {item.type === 'metric' && <Calculator className="h-4 w-4" />}
            {item.type === 'chart' && <PieChart className="h-4 w-4" />}
            {item.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {item.type === 'report' && report ? (
            <ReportPreview
              data={data}
              columns={Array.isArray(report.selected_fields) ? report.selected_fields.map(f => String(f)) : []}
              chartType={report.chart_type || 'table'}
              isLoading={isLoading}
              onRunReport={() => {}}
              onExportCsv={() => {}}
              chartConfig={{
                type: report.chart_type || 'table',
                xAxis: report.group_by,
                aggregation: report.aggregation as any,
                dateGrouping: report.date_grouping as any
              }}
              hideActions={true}
              compact={true}
            />
          ) : item.type === 'metric' ? (
            <div className="flex items-center justify-center h-20">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {isLoading ? '...' : (data[0]?.value || '0')}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {item.metric?.aggregation.toUpperCase()} of {item.metric?.field === '*' ? 'records' : item.metric?.field}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 bg-muted rounded">
              <PieChart className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Convert DashboardItem to format expected by ResizableDashboard
  const convertToResizableDashboardItems = (items: DashboardItem[]) => {
    return items.map(item => ({
      id: item.id,
      type: item.type,
      title: item.title,
      content: renderDashboardItemContent(item)
    }));
  };

  const renderDashboardItemContent = (item: DashboardItem) => {
    const isLoading = loadingItems.has(item.id);
    const data = dashboardData[item.id] || [];
    const report = item.reportId ? reports?.find(r => r.id === item.reportId) : null;

    if (item.type === 'report' && report) {
      return (
        <ReportPreview
          data={data}
          columns={Array.isArray(report.selected_fields) ? report.selected_fields.map(f => String(f)) : []}
          chartType={report.chart_type || 'table'}
          isLoading={isLoading}
          onRunReport={() => {}}
          onExportCsv={() => {}}
          chartConfig={{
            type: report.chart_type || 'table',
            xAxis: report.group_by,
            aggregation: report.aggregation as any,
            dateGrouping: report.date_grouping as any
          }}
          hideActions={true}
          compact={true}
        />
      );
    } else if (item.type === 'metric') {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {isLoading ? '...' : (data[0]?.value || '0')}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {item.metric?.aggregation.toUpperCase()} of {item.metric?.field === '*' ? 'records' : item.metric?.field}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center h-full bg-muted rounded">
          <PieChart className="h-12 w-12 text-muted-foreground" />
        </div>
      );
    }
  };

  // Show builder mode
  if (showBuilder) {
    return (
      <>
        <Helmet>
          <title>{editingDashboard ? 'Edit Dashboard' : 'Dashboard Builder'} | Case Management</title>
        </Helmet>
        
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">
                {editingDashboard ? 'Edit Dashboard' : 'Dashboard Builder'}
              </h1>
              <p className="text-muted-foreground">
                {editingDashboard ? `Editing: ${editingDashboard.name}` : 'Create custom dashboards with reports and metrics'}
              </p>
            </div>
            <Button variant="outline" onClick={handleBackToDashboards}>
              Back to Dashboards
            </Button>
          </div>

          <DashboardBuilder 
            onSave={handleSaveDashboard}
            initialDashboard={editingDashboard}
          />
        </div>
      </>
    );
  }

  // Show resizable dashboard view mode
  if (viewingDashboard) {
    return (
      <>
        <Helmet>
          <title>{viewingDashboard.name} | Case Management</title>
        </Helmet>
        
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">{viewingDashboard.name}</h1>
              <p className="text-muted-foreground">
                {viewingDashboard.items.length} items • Created {new Date(viewingDashboard.createdAt).toLocaleDateString()}
                {viewingDashboard.isPublic && <span className="ml-2 text-green-600">• Public</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refreshDashboard}>
                Refresh
              </Button>
              <Button variant="outline" onClick={() => handleEditDashboard(viewingDashboard)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" onClick={handleBackToDashboards}>
                Back to Dashboards
              </Button>
            </div>
          </div>

          {viewingDashboard.items.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">This dashboard has no items yet.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleEditDashboard(viewingDashboard)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Items
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ResizableDashboard
              dashboardId={viewingDashboard.id}
              items={convertToResizableDashboardItems(viewingDashboard.items)}
              onItemsChange={() => {}}
            />
          )}
        </div>
      </>
    );
  }

  // Show dashboard list
  return (
    <>
      <Helmet>
        <title>Dashboards | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboards</h1>
            <p className="text-muted-foreground">
              Create and manage custom dashboards with your reports
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedDashboards.length > 0 ? (
            savedDashboards.map((dashboard) => (
              <Card key={dashboard.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    {dashboard.name}
                    {dashboard.isPublic && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Public
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {dashboard.items.length} items • Created {new Date(dashboard.createdAt).toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDashboard(dashboard)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditDashboard(dashboard)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteDashboard(dashboard.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">Executive Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  High-level metrics and KPIs
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sample dashboard - use the builder to create your own!
                </p>
                <Button variant="outline" size="sm" onClick={handleCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboards;
