
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

interface SimpleReportViewerProps {
  reportId: string;
  onClose: () => void;
}

interface ReportData {
  id: string;
  name: string;
  description?: string;
  module: string;
  base_table: string;
  selected_fields: any[];
  filters: any[];
  chart_type: string;
  is_public: boolean;
  created_at: string;
}

const SimpleReportViewer = ({ reportId, onClose }: SimpleReportViewerProps) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      // Use RPC function to avoid TypeScript issues with dynamic table names
      const { data: reportData, error } = await supabase.rpc('execute_query', {
        query_text: `SELECT * FROM reports WHERE id = '${reportId}'`
      });

      if (error) throw error;
      
      if (reportData && Array.isArray(reportData) && reportData.length > 0) {
        const reportRecord = reportData[0] as ReportData;
        setReport(reportRecord);
        await executeReport(reportRecord);
      } else {
        throw new Error('Report not found');
      }
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

  const executeReport = async (reportData: ReportData) => {
    if (!reportData) return;
    
    setExecuting(true);
    try {
      const tableName = reportData.base_table || reportData.module;
      
      // Use RPC function to execute the query safely
      const { data: queryData, error } = await supabase.rpc('execute_query', {
        query_text: `SELECT * FROM ${tableName} LIMIT 100`
      });

      if (error) throw error;
      
      if (queryData && Array.isArray(queryData)) {
        setData(queryData);
      } else {
        setData([]);
      }
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

export default SimpleReportViewer;
