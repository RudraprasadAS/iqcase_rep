import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Eye, Edit, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReportViewer } from '@/components/reports/ReportViewer';

interface Report {
  id: string;
  name: string;
  description?: string;
  module: string;
  chart_type: string;
  created_at: string;
  created_by: string;
  is_public: boolean;
}

const StandardReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getModuleColor = (module: string) => {
    const colors = {
      cases: 'bg-blue-100 text-blue-800',
      users: 'bg-green-100 text-green-800',
      activities: 'bg-purple-100 text-purple-800',
      feedback: 'bg-orange-100 text-orange-800'
    };
    return colors[module as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (selectedReportId) {
    return (
      <>
        <Helmet>
          <title>View Report - IQCase</title>
        </Helmet>
        <div className="container mx-auto py-6">
          <ReportViewer 
            reportId={selectedReportId} 
            onClose={() => setSelectedReportId(null)} 
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Standard Reports - IQCase</title>
      </Helmet>

      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Standard Reports</h1>
            <p className="text-muted-foreground">View and manage your custom reports</p>
          </div>
          <Button onClick={() => navigate('/report-builder')}>
            Create New Report
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No reports found</h3>
                <p className="text-muted-foreground">Create your first report to get started</p>
                <Button onClick={() => navigate('/report-builder')} className="mt-4">
                  Create Report
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {report.description || 'No description provided'}
                      </CardDescription>
                    </div>
                    {report.is_public && (
                      <Badge variant="secondary" className="ml-2">Public</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getModuleColor(report.module)}>
                      {report.module}
                    </Badge>
                    <Badge variant="outline">
                      {report.chart_type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(report.created_at)}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSelectedReportId(report.id)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/report-builder?edit=${report.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default StandardReports;
