
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, Users, Lock } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PageAccessControl, ButtonAccessControl } from '@/components/auth';

const Reports = () => {
  const navigate = useNavigate();
  const { reports, isLoadingReports, deleteReport } = useReports();

  const handleCreateReport = () => {
    navigate('/reports/builder');
  };

  const handleEditReport = (reportId: string) => {
    navigate(`/reports/builder?id=${reportId}&edit=true`);
  };

  const handleViewReport = (reportId: string) => {
    navigate(`/reports/builder?id=${reportId}&view=true`);
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteReport.mutateAsync(reportId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <PageAccessControl module="reports">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">
              Create and manage custom reports for your data analysis needs
            </p>
          </div>
          <ButtonAccessControl module="reports" element_key="reports.create_report">
            <Button onClick={handleCreateReport}>
              <Plus className="h-4 w-4 mr-2" />
              Create Report
            </Button>
          </ButtonAccessControl>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">My Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingReports ? (
              <div className="col-span-full text-center py-8">Loading reports...</div>
            ) : reports && reports.length > 0 ? (
              reports.map((report) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{report.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {report.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {report.is_public ? (
                          <Users className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Lock className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {report.base_table || report.module}
                        </Badge>
                        <Badge variant="outline">
                          {report.chart_type || 'table'}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Created: {formatDate(report.created_at)}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(report.id)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <ButtonAccessControl 
                          module="reports" 
                          element_key="reports.edit_report"
                          fallback={<div className="flex-1" />}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditReport(report.id)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </ButtonAccessControl>
                        <ButtonAccessControl 
                          module="reports" 
                          element_key="reports.delete_report"
                        >
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
                                <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </ButtonAccessControl>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No reports found. Create your first report to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </PageAccessControl>
  );
};

export default Reports;
