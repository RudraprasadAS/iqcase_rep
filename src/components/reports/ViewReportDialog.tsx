
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Play, Loader2 } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { Report } from '@/types/reports';

interface ViewReportDialogProps {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ViewReportDialog = ({ report, open, onOpenChange }: ViewReportDialogProps) => {
  const { executeReport } = useReports();
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    if (open && report) {
      handleRunReport();
    }
  }, [open, report]);

  const handleRunReport = async () => {
    try {
      const result = await executeReport.mutateAsync(report);
      if (result.error) {
        console.error('Report error:', result.error);
        setReportData([]);
      } else {
        setReportData(result.data);
      }
    } catch (error) {
      console.error('Failed to run report:', error);
      setReportData([]);
    }
  };

  const handleExportCsv = () => {
    if (!reportData || reportData.length === 0) return;
    
    const headers = report.selected_fields;
    const csvContent = [
      headers.join(','),
      ...reportData.map(row =>
        headers.map(header => {
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
    link.download = `${report.name}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{report.name}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                disabled={!reportData || reportData.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                size="sm"
                onClick={handleRunReport}
                disabled={executeReport.isPending}
              >
                {executeReport.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {executeReport.isPending ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Running report...</p>
              </div>
            </div>
          ) : reportData && reportData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {reportData.length} {reportData.length === 1 ? 'record' : 'records'} found
                </p>
              </div>
              
              <div className="overflow-x-auto border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {report.selected_fields.map((field) => (
                        <TableHead key={field}>
                          {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row, index) => (
                      <TableRow key={index}>
                        {report.selected_fields.map((field) => (
                          <TableCell key={`${index}-${field}`}>
                            {row[field] !== null && row[field] !== undefined
                              ? String(row[field])
                              : '-'}
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
  );
};
