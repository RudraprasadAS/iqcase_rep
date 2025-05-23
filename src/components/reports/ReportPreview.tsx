
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

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
  onRunReport?: () => void;
  onExportCsv?: () => void;
  chartConfig?: ChartConfig;
}

// Generate color array for charts
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', 
  '#a4de6c', '#d0ed57', '#ffc658', '#ff8042',
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042'
];

export const ReportPreview = ({
  data,
  columns,
  chartType,
  isLoading,
  onRunReport = () => {},
  onExportCsv = () => {},
  chartConfig
}: ReportPreviewProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p className="mb-4">No data to display.</p>
        <p className="mb-6">Run the report to see results.</p>
        <Button 
          onClick={onRunReport} 
          disabled={isLoading}
          className="mt-2"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Report
        </Button>
      </div>
    );
  }

  const rows = Array.isArray(data) ? data : [];
  
  // Function to format dates based on grouping
  const formatDateByGrouping = (dateValue: any, grouping?: string): string => {
    if (!dateValue) return 'Unknown';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return String(dateValue);
    
    switch (grouping) {
      case 'day':
        return date.toLocaleDateString();
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return `Week of ${startOfWeek.toLocaleDateString()}`;
      case 'month':
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString();
    }
  };

  // Function to get date grouping key for aggregation
  const getDateGroupingKey = (dateValue: any, grouping?: string): string => {
    if (!dateValue) return 'Unknown';
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return String(dateValue);
    
    switch (grouping) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        return startOfWeek.toISOString().split('T')[0];
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `${date.getFullYear()}-Q${quarter}`;
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toISOString().split('T')[0];
    }
  };

  // Check if a field is a date field
  const isDateField = (fieldName: string): boolean => {
    const dateIndicators = ['date', 'time', 'created', 'updated', '_at'];
    return dateIndicators.some(indicator => fieldName.toLowerCase().includes(indicator));
  };

  // Prepare data for charts using the new chart configuration
  const prepareChartData = () => {
    if (!chartConfig || chartType === 'table' || !chartConfig.xAxis || !Array.isArray(rows)) return [];

    const isDateFieldSelected = isDateField(chartConfig.xAxis);

    // Group data by X-axis field
    const grouped = rows.reduce((acc, row) => {
      let xValue;
      
      if (isDateFieldSelected && chartConfig.dateGrouping) {
        // Use date grouping for date fields
        const groupingKey = getDateGroupingKey(row[chartConfig.xAxis!], chartConfig.dateGrouping);
        xValue = formatDateByGrouping(row[chartConfig.xAxis!], chartConfig.dateGrouping);
        // Use grouping key for consistent aggregation
        const key = `${groupingKey}|${xValue}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(row);
      } else {
        // Regular grouping for non-date fields
        xValue = row[chartConfig.xAxis!] || 'Unknown';
        if (!acc[xValue]) {
          acc[xValue] = [];
        }
        acc[xValue].push(row);
      }
      
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate aggregated values
    const chartData = Object.entries(grouped).map(([key, groupRows]) => {
      // Extract display name from key (for date fields with grouping)
      const displayName = key.includes('|') ? key.split('|')[1] : key;
      const result: any = { name: displayName };
      
      if (chartConfig.aggregation === 'count') {
        result.value = Array.isArray(groupRows) ? groupRows.length : 0;
      } else if (chartConfig.yAxis && chartConfig.aggregation && Array.isArray(groupRows)) {
        const values = groupRows
          .map(row => Number(row[chartConfig.yAxis!]))
          .filter(val => !isNaN(val));
        
        switch (chartConfig.aggregation) {
          case 'sum':
            result.value = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            result.value = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            break;
          case 'min':
            result.value = values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            result.value = values.length > 0 ? Math.max(...values) : 0;
            break;
          default:
            result.value = Array.isArray(groupRows) ? groupRows.length : 0;
        }
      } else {
        result.value = Array.isArray(groupRows) ? groupRows.length : 0;
      }
      
      return result;
    });

    // Sort data appropriately
    if (isDateFieldSelected) {
      // Sort by the original date grouping key for proper chronological order
      return chartData.sort((a, b) => {
        const aKey = Object.keys(grouped).find(key => key.includes(a.name))?.split('|')[0] || a.name;
        const bKey = Object.keys(grouped).find(key => key.includes(b.name))?.split('|')[0] || b.name;
        return aKey.localeCompare(bKey);
      });
    } else {
      // Sort by value descending for non-date fields
      return chartData.sort((a, b) => b.value - a.value);
    }
  };
  
  const chartData = prepareChartData();
  
  const renderChart = () => {
    if (!chartConfig || !Array.isArray(chartData) || chartData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Configure chart axes to display visualization.</p>
          <p>Select X-axis and aggregation method in the chart configuration.</p>
        </div>
      );
    }
    
    const getChartTitle = () => {
      const aggregationLabel = chartConfig.aggregation || 'count';
      const xAxisLabel = chartConfig.xAxis || 'field';
      const dateGroupingLabel = chartConfig.dateGrouping ? ` (${chartConfig.dateGrouping})` : '';
      return `${aggregationLabel} by ${xAxisLabel}${dateGroupingLabel}`;
    };
    
    const chartTitle = getChartTitle();
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={chartData.length > 5 ? -45 : 0}
                textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                height={chartData.length > 5 ? 80 : 60}
              />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, chartTitle]} />
              <Bar dataKey="value" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name"
                angle={chartData.length > 5 ? -45 : 0}
                textAnchor={chartData.length > 5 ? 'end' : 'middle'}
                height={chartData.length > 5 ? 80 : 60}
              />
              <YAxis />
              <Tooltip formatter={(value, name) => [value, chartTitle]} />
              <Line type="monotone" dataKey="value" stroke={COLORS[0]} />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label={({ name, percent }) => 
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, chartTitle]} />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return renderTableView();
    }
  };
  
  const renderTableView = () => (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={`${index}-${column}`}>
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center"
              >
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Report Results</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            disabled={!data || rows.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={onRunReport}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>
      
      {chartType === 'table' ? renderTableView() : renderChart()}
      
      {rows && rows.length > 0 && (
        <div className="text-sm text-muted-foreground text-right">
          Total rows: {rows.length}
        </div>
      )}
    </div>
  );
};
