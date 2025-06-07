
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Download } from 'lucide-react';
import { ReportPreview } from './ReportPreview';
import { useReports } from '@/hooks/useReports';
import { Report } from '@/types/reports';

interface ReportViewerProps {
  reportId: string;
}

export const ReportViewer = ({ reportId }: ReportViewerProps) => {
  const { reports, isLoadingReports, runReportWithJoins } = useReports();
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);

  useEffect(() => {
    if (reports && reportId) {
      const report = reports.find(r => r.id === reportId);
      if (report) {
        setCurrentReport(report);
      }
    }
  }, [reports, reportId]);

  const handleRunReport = async () => {
    if (!currentReport) return;
    
    setIsLoadingData(true);
    try {
      const result = await runReportWithJoins.mutateAsync({
        baseTable: currentReport.base_table,
        selectedColumns: currentReport.fields,
        filters: currentReport.filters || []
      });
      
      setReportData(result.rows || []);
    } catch (error) {
      console.error('Error running report:', error);
      setReportData([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const exportToCsv = () => {
    if (!reportData || reportData.length === 0 || !currentReport) return;
    
    const headers = currentReport.fields;
    let csvContent = headers.join(',') + '\n';
    
    reportData.forEach((row) => {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvContent += values.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentReport.name || 'report'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingReports) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentReport) {
    return (
      <div className="text-center p-8">
        <p>Report not found.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{currentReport.name}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCsv}
              disabled={!reportData || reportData.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={handleRunReport}
              disabled={isLoadingData}
            >
              {isLoadingData ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Report
            </Button>
          </div>
        </CardTitle>
        {currentReport.description && (
          <p className="text-sm text-muted-foreground">{currentReport.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <ReportPreview
          data={reportData}
          columns={currentReport.fields}
          chartType={currentReport.chart_type || 'table'}
          isLoading={isLoadingData}
          onRunReport={handleRunReport}
          onExportCsv={exportToCsv}
          hideActions={true}
        />
      </CardContent>
    </Card>
  );
};
