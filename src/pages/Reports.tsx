
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Eye, Users, Lock, Play, Download } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Reports = () => {
  const navigate = useNavigate();
  const { reports, isLoadingReports, deleteReport, runReport } = useReports();
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoadingReportData, setIsLoadingReportData] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleCreateReport = () => {
    navigate('/report-builder');
  };

  const handleEditReport = (reportId: string) => {
    navigate(`/report-builder?edit=${reportId}`);
  };

  const handleViewReport = async (report: any) => {
    setSelectedReport(report);
    setIsLoadingReportData(true);
    setShowReportDialog(true);
    
    try {
      const result = await runReport.mutateAsync(report.id);
      setReportData(result);
    } catch (error) {
      console.error('Error running report:', error);
      setReportData(null);
    } finally {
      setIsLoadingReportData(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    await deleteReport.mutateAsync(reportId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const exportToCsv = () => {
    if (!reportData || !reportData.rows || reportData.rows.length === 0) return;

    const headers = reportData.columns || Object.keys(reportData.rows[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.rows.map((row: any) =>
        headers.map((header: string) => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedReport?.name || 'report'}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Custom Reports</h1>
          <p className="text-muted-foreground">
            Create and manage custom reports for your data analysis needs
          </p>
        </div>
        <Button onClick={handleCreateReport}>
          <Plus className="h-4 w-4 mr-2" />
          Create Report
        </Button>
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
                        onClick={() => handleViewReport(report)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditReport(report.id)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
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
                            <AlertDialogAction onClick={() => handleDeleteReport(report.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

      {/* Report View Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedReport?.name} - Report View</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCsv}
                  disabled={!reportData || !reportData.rows || reportData.rows.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleViewReport(selectedReport)}
                  disabled={isLoadingReportData}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {isLoadingReportData ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                  <p>Running report...</p>
                </div>
              </div>
            ) : reportData && reportData.rows && reportData.rows.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {reportData.rows.length} {reportData.rows.length === 1 ? 'record' : 'records'} found
                  </p>
                </div>
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(reportData.columns || Object.keys(reportData.rows[0])).map((key: string) => (
                          <TableHead key={key}>
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.rows.map((row: any, index: number) => (
                        <TableRow key={index}>
                          {(reportData.columns || Object.keys(row)).map((key: string, cellIndex: number) => (
                            <TableCell key={cellIndex}>
                              {row[key] === null || row[key] === undefined ? '-' : String(row[key])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No data found</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;
