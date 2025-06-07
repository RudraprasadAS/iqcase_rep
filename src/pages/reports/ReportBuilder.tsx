
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { CreateReportDialog } from '@/components/reports/CreateReportDialog';

const ReportBuilder = () => {
  const { reports, isLoadingReports } = useReports();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  if (isLoadingReports) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Report Builder | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Report Builder</h1>
            <p className="text-muted-foreground">Create custom reports with advanced filtering and visualization</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Build New Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowCreateDialog(true)}>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Plus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create New Report</h3>
              <p className="text-sm text-muted-foreground text-center">
                Build a custom report with your own data sources and visualizations
              </p>
            </CardContent>
          </Card>

          {reports?.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{report.name}</CardTitle>
                {report.description && (
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(report.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <CreateReportDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </>
  );
};

export default ReportBuilder;
