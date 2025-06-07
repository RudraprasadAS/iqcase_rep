
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Play, BarChart3, LineChart, PieChart, Table } from 'lucide-react';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from 'recharts';
import { format, parseISO, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

interface ChartConfig {
  type: 'table' | 'bar' | 'line' | 'pie';
  xAxis?: string;
  yAxis?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  dateGrouping?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

interface ReportPreviewProps {
  data: any[];
  columns: string[];
  chartType: 'table' | 'bar' | 'line' | 'pie';
  isLoading: boolean;
  onRunReport: () => void;
  onExportCsv: () => void;
  chartConfig?: ChartConfig;
  hideActions?: boolean;
  compact?: boolean;
}

interface ChartDataPoint {
  [key: string]: any;
  value: number;
  label: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const ReportPreview = ({
  data,
  columns,
  chartType,
  isLoading,
  onRunReport,
  onExportCsv,
  chartConfig,
  hideActions = false,
  compact = false
}: ReportPreviewProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = compact ? 5 : 10;

  const processDataForChart = (): ChartDataPoint[] => {
    if (!Array.isArray(data) || data.length === 0 || !chartConfig) return [];

    const xAxis = chartConfig.xAxis;
    const aggregation = chartConfig.aggregation || 'count';
    const dateGrouping = chartConfig.dateGrouping;

    if (!xAxis) return [];

    // Group data by xAxis field
    const grouped = data.reduce((acc: Record<string, any[]>, row: any) => {
      let key = row[xAxis];
      
      // Handle date grouping
      if (dateGrouping && key) {
        try {
          const date = typeof key === 'string' ? parseISO(key) : new Date(key);
          switch (dateGrouping) {
            case 'week':
              key = format(startOfWeek(date), 'yyyy-MM-dd');
              break;
            case 'month':
              key = format(startOfMonth(date), 'yyyy-MM');
              break;
            case 'quarter':
              key = format(startOfQuarter(date), 'yyyy-QQ');
              break;
            case 'year':
              key = format(startOfYear(date), 'yyyy');
              break;
            case 'day':
            default:
              key = format(date, 'yyyy-MM-dd');
              break;
          }
        } catch (error) {
          console.warn('Error processing date for grouping:', error);
        }
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(row);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate aggregated values
    return Object.entries(grouped).map(([key, values]) => {
      let aggregatedValue: number;
      
      // Ensure values is an array
      if (!Array.isArray(values)) {
        console.warn('Values is not an array:', values);
        return {
          [xAxis]: key,
          value: 0,
          label: key
        } as ChartDataPoint;
      }
      
      if (aggregation === 'count') {
        aggregatedValue = values.length;
      } else if (chartConfig.yAxis) {
        const numericValues: number[] = values
          .map((v: any) => parseFloat(v[chartConfig.yAxis!]))
          .filter((v: number) => !isNaN(v));
        
        switch (aggregation) {
          case 'sum':
            aggregatedValue = numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) : 0;
            break;
          case 'avg':
            aggregatedValue = numericValues.length > 0 
              ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length 
              : 0;
            break;
          case 'min':
            aggregatedValue = numericValues.length > 0 ? Math.min(...numericValues) : 0;
            break;
          case 'max':
            aggregatedValue = numericValues.length > 0 ? Math.max(...numericValues) : 0;
            break;
          default:
            aggregatedValue = values.length;
        }
      } else {
        aggregatedValue = values.length;
      }

      return {
        [xAxis]: key,
        value: aggregatedValue,
        label: key
      } as ChartDataPoint;
    }).sort((a, b) => a.label.localeCompare(b.label));
  };

  const renderChart = () => {
    const chartData = processDataForChart();
    const containerHeight = compact ? 200 : 400;
    const margin = compact ? { top: 5, right: 30, left: 5, bottom: 5 } : { top: 20, right: 50, left: 20, bottom: 80 };

    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No data available for chart</p>
          </div>
        </div>
      );
    }

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={containerHeight}>
            <BarChart data={chartData} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfig?.xAxis || 'label'} 
                fontSize={compact ? 10 : 12}
                tick={{ fontSize: compact ? 10 : 12 }}
              />
              <YAxis fontSize={compact ? 10 : 12} />
              <Tooltip />
              {!compact && <Legend />}
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={containerHeight}>
            <RechartsLineChart data={chartData} margin={margin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={chartConfig?.xAxis || 'label'} 
                fontSize={compact ? 10 : 12}
              />
              <YAxis fontSize={compact ? 10 : 12} />
              <Tooltip />
              {!compact && <Legend />}
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </RechartsLineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={containerHeight}>
            <RechartsPieChart margin={margin}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={compact ? 60 : 80}
                fill="#8884d8"
                dataKey="value"
                label={!compact ? (entry) => entry.label : false}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              {!compact && <Legend />}
            </RechartsPieChart>
          </ResponsiveContainer>
        );

      default:
        return renderTable();
    }
  };

  const renderTable = () => {
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Table className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No data to display</p>
        </div>
      );
    }

    const headers = columns.length > 0 ? columns : Object.keys(data[0] || {});
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    return (
      <div className="space-y-4">
        <div className="rounded-md border overflow-auto max-h-96">
          <UITable>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className={compact ? "text-xs p-2" : ""}>
                    {header.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => (
                <TableRow key={index}>
                  {headers.map((header) => (
                    <TableCell key={header} className={compact ? "text-xs p-2" : ""}>
                      {row[header] !== null && row[header] !== undefined 
                        ? String(row[header]) 
                        : '-'
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </UITable>
        </div>

        {!compact && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} results
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hideActions && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {chartType === 'table' && <Table className="h-3 w-3" />}
              {chartType === 'bar' && <BarChart3 className="h-3 w-3" />}
              {chartType === 'line' && <LineChart className="h-3 w-3" />}
              {chartType === 'pie' && <PieChart className="h-3 w-3" />}
              {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
            </Badge>
            {Array.isArray(data) && data.length > 0 && (
              <Badge variant="secondary">
                {data.length} record{data.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCsv}
              disabled={!Array.isArray(data) || data.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={onRunReport}
            >
              <Play className="mr-2 h-4 w-4" />
              Run Report
            </Button>
          </div>
        </div>
      )}

      {chartType === 'table' ? renderTable() : renderChart()}
    </div>
  );
};
