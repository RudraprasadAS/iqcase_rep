
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Play } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { CreateReportDialog } from '@/components/reports/CreateReportDialog';
import { ViewReportDialog } from '@/components/reports/ViewReportDialog';
import { EditReportDialog } from '@/components/reports/EditReportDialog';
import { Report } from '@/types/reports';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Reports = () => {
  const { reports, isLoadingReports, deleteReport } = useReports();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [editingReport, setEditingReport] = useState<Report | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
        <title>Reports | Case Management</title>
      </Helmet>
      
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Create and manage custom reports</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>

        {!reports || reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">No reports found</h3>
                <p className="text-muted-foreground">Create your first report to get started</p>
                <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
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
                      {report.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {report.table_name}
                    </Badge>
                    <Badge variant="outline">
                      {report.selected_fields.length} fields
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(report.created_at)}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setViewingReport(report)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingReport(report)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Report</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{report.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteReport.mutate(report.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <CreateReportDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
        
        {viewingReport && (
          <ViewReportDialog
            report={viewingReport}
            open={!!viewingReport}
            onOpenChange={() => setViewingReport(null)}
          />
        )}
        
        {editingReport && (
          <EditReportDialog
            report={editingReport}
            open={!!editingReport}
            onOpenChange={() => setEditingReport(null)}
          />
        )}
      </div>
    </>
  );
};

export default Reports;
