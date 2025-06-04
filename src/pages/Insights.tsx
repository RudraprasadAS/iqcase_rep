
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useInsights } from '@/hooks/useInsights';
import { 
  Plus, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const Insights = () => {
  const navigate = useNavigate();
  const { reports, dashboards, isLoadingReports, isLoadingDashboards, deleteReport } = useInsights();

  const handleCreateReport = () => {
    navigate('/insights/report-builder');
  };

  const handleCreateDashboard = () => {
    navigate('/insights/dashboard-builder');
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/insights/report-builder?id=${reportId}&mode=view`);
  };

  const handleEditReport = (reportId: string) => {
    navigate(`/insights/report-builder?id=${reportId}&mode=edit`);
  };

  const handleViewDashboard = (dashboardId: string) => {
    navigate(`/insights/dashboard?id=${dashboardId}`);
  };

  const handleEditDashboard = (dashboardId: string) => {
    navigate(`/insights/dashboard-builder?id=${dashboardId}`);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      await deleteReport.mutateAsync(reportId);
    }
  };

  return (
    <>
      <Helmet>
        <title>Insights | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Insights</h1>
            <p className="text-muted-foreground">Create reports and dashboards to analyze your data</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreateReport}>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
            <Button variant="outline" onClick={handleCreateDashboard}>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          </div>
        </div>

        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            {isLoadingReports ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                        </div>
                        <Badge variant="secondary">
                          {report.chart_config?.type || 'table'}
                        </Badge>
                      </div>
                      {report.description && (
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>Fields: {Array.isArray(report.selected_fields) ? report.selected_fields.length : 0}</span>
                        <span>Filters: {Array.isArray(report.filters) ? report.filters.length : 0}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewReport(report.id)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditReport(report.id)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No reports yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first report to start analyzing your data
                  </p>
                  <Button onClick={handleCreateReport}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Report
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="dashboards" className="space-y-4">
            {isLoadingDashboards ? (
              <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : dashboards && dashboards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboards.map((dashboard) => (
                  <Card key={dashboard.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      </div>
                      {dashboard.description && (
                        <p className="text-sm text-muted-foreground">{dashboard.description}</p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span>Widgets: {Array.isArray(dashboard.layout_config) ? dashboard.layout_config.length : 0}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {dashboard.refresh_interval}s
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleViewDashboard(dashboard.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleEditDashboard(dashboard.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <PieChart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No dashboards yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first dashboard to visualize multiple reports
                  </p>
                  <Button variant="outline" onClick={handleCreateDashboard}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default Insights;
