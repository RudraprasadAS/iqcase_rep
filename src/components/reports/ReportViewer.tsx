
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { X, Download, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Json } from '@/integrations/supabase/types';

interface ReportViewerProps {
  reportId: string;
  onClose: () => void;
}

interface ReportData {
  id: string;
  name: string;
  description?: string;
  module: string;
  selected_fields: Json;
  filters: Json;
  group_by?: string;
  aggregation?: string;
  chart_type: string;
  created_at: string;
  created_by: string;
}

interface ReportResult {
  data: any[];
  total: number;
}

const ReportViewer = ({ reportId, onClose }: ReportViewerProps) => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) throw error;
      
      setReport(data);
      await executeReport(data);
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
      // Parse selected fields and filters from JSON
      const selectedFields = Array.isArray(reportData.selected_fields) 
        ? reportData.selected_fields 
        : reportData.selected_fields ? [reportData.selected_fields] : [];
      
      const filters = Array.isArray(reportData.filters) 
        ? reportData.filters 
        : [];

      // Build query based on report configuration
      let queryBuilder = supabase.from(reportData.module as any);
      
      // Apply selected fields
      if (selectedFields && selectedFields.length > 0) {
        const fields = selectedFields.join(', ');
        queryBuilder = queryBuilder.select(fields);
      } else {
        queryBuilder = queryBuilder.select('*');
      }

      // Apply filters
      if (filters && filters.length > 0) {
        filters.forEach((filter: any) => {
          switch (filter.operator) {
            case 'eq':
              queryBuilder = queryBuilder.eq(filter.field, filter.value);
              break;
            case 'neq':
              queryBuilder = queryBuilder.neq(filter.field, filter.value);
              break;
            case 'gt':
              queryBuilder = queryBuilder.gt(filter.field, filter.value);
              break;
            case 'lt':
              queryBuilder = queryBuilder.lt(filter.field, filter.value);
              break;
            case 'like':
              queryBuilder = queryBuilder.ilike(filter.field, `%${filter.value}%`);
              break;
          }
        });
      }

      // Execute query
      const { data, error, count } = await queryBuilder;
      
      if (error) throw error;
      
      setResult({
        data: data || [],
        total: count || data?.length || 0
      });
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
      // Try to format as date if it looks like ISO string
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
        ) : result ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {result.total} {result.total === 1 ? 'record' : 'records'} found
              </p>
            </div>
            
            {result.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      {Object.keys(result.data[0]).map((key) => (
                        <th key={key} className="border border-gray-200 px-3 py-2 text-left text-sm font-medium">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.data.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="border border-gray-200 px-3 py-2 text-sm">
                            {formatValue(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No data found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Click refresh to load data</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportViewer;
