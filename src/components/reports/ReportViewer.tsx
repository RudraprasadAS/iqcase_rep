
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Report } from '@/types/reports';

interface ReportViewerProps {
  reportId: string;
  onClose: () => void;
}

const ReportViewer = ({ reportId, onClose }: ReportViewerProps) => {
  const [report, setReport] = useState<Report | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const { data: reportData, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      
      // Helper function to validate chart_type
      const validateChartType = (chartType: string | null): 'table' | 'bar' | 'line' | 'pie' => {
        if (chartType === 'bar' || chartType === 'line' || chartType === 'pie') {
          return chartType;
        }
        return 'table'; // Default fallback
      };

      // Transform the database response to match the Report interface
      const transformedReport: Report = {
        ...reportData,
        fields: Array.isArray(reportData.selected_fields) 
          ? reportData.selected_fields as string[]
          : typeof reportData.selected_fields === 'string'
          ? [reportData.selected_fields]
          : [],
        base_table: reportData.module,
        chart_type: validateChartType(reportData.chart_type),
        filters: Array.isArray(reportData.filters) 
          ? reportData.filters as any[]
          : typeof reportData.filters === 'string'
          ? JSON.parse(reportData.filters)
          : [],
        joins: [] // Default empty array for joins
      };
      
      setReport(transformedReport);
      await executeReport(transformedReport);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const executeReport = async (reportData: Report) => {
    if (!reportData) return;
    
    setExecuting(true);
    try {
      // For now, let's just fetch from the specified module/table
      const tableName = reportData.module;
      
      const { data: queryData, error } = await supabase
        .from(tableName as any)
        .select('*')
        .limit(100);

      if (error) throw error;
      
      setData(queryData || []);
    } catch (error) {
      console.error('Error executing report:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute report',
        variant: 'destructive'
      });
    } finally {
      setExecuting(false);
    }
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'string' && value.includes('T')) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return String(value);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading report...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <p>Report not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {report.name}
            <Badge variant="outline">{report.module}</Badge>
          </CardTitle>
          {report.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {report.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => executeReport(report)}
            disabled={executing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${executing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {executing ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Executing report...</p>
            </div>
          </div>
        ) : data.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.length} {data.length === 1 ? 'record' : 'records'} found
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(data[0]).map((key) => (
                      <TableHead key={key}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>
                          {formatValue(value)}
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
      </CardContent>
    </Card>
  );
};

export default ReportViewer;
