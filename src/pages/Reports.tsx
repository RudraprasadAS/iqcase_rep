
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, FileText, Plus, Settings, Database, Eye, Edit } from 'lucide-react';
import { useReports } from '@/hooks/useReports';

const Reports = () => {
  const navigate = useNavigate();
  const { reports, isLoadingReports } = useReports();
  
  return (
    <>
      <Helmet>
        <title>Reports | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">View and manage reports</p>
            {reports && reports.length > 0 && (
              <p className="text-sm text-green-600 mt-1">
                {reports.length} custom report{reports.length > 1 ? 's' : ''} available
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => navigate('/reports/builder')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Report
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/reports/standard')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Standard Reports
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/reports/table-builder')}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Table Report Builder
            </Button>
          </div>
        </div>
        
        {/* Custom Reports Section */}
        {isLoadingReports ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Custom Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{report.name}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {report.chart_type || 'table'}
                      </span>
                    </CardTitle>
                    {report.description && (
                      <CardDescription className="truncate">
                        {report.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Module:</span> {report.module}
                      </div>
                      <div>
                        <span className="font-medium">Fields:</span> {Array.isArray(report.selected_fields) ? report.selected_fields.length : 0} selected
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(report.created_at || '').toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Visibility:</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${report.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {report.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/reports/builder?id=${report.id}`)}
                        className="flex-1 gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate(`/reports/builder?id=${report.id}&edit=true`)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Standard Reports Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart className="mr-2 h-5 w-5" />
                Standard Reports
              </CardTitle>
              <CardDescription>
                Access pre-built reports for common use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                View standard reports for cases, users, and more. These reports are pre-configured
                and ready to use.
              </p>
              <Button 
                variant="default" 
                onClick={() => navigate('/reports/standard')}
                className="w-full"
              >
                <FileText className="mr-2 h-4 w-4" />
                View Standard Reports
              </Button>
            </CardContent>
          </Card>
          
          {/* Custom Reports Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Custom Reports
              </CardTitle>
              <CardDescription>
                Build your own custom reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                Create customized reports with the fields, filters, and visualizations of your choice.
                Save and share your reports with your team.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('/reports/builder')}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Custom Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Reports;
