
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
import { ReportData } from '@/types/reports';
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

interface ReportPreviewProps {
  reportData: ReportData | null;
  visualizationType: 'table' | 'bar' | 'line' | 'pie';
  isRunning: boolean;
  onRunReport: () => void;
  onExportCsv: () => void;
}

// Generate color array for charts
const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', 
  '#a4de6c', '#d0ed57', '#ffc658', '#ff8042',
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042'
];

export const ReportPreview = ({
  reportData,
  visualizationType,
  isRunning,
  onRunReport,
  onExportCsv
}: ReportPreviewProps) => {
  if (!reportData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <p className="mb-4">No data to display.</p>
        <p className="mb-6">Run the report to see results.</p>
        <Button 
          onClick={onRunReport} 
          disabled={isRunning}
          className="mt-2"
        >
          {isRunning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Report
        </Button>
      </div>
    );
  }

  const { columns, rows } = reportData;
  
  // Prepare data for charts
  const prepareChartData = () => {
    if (columns.length < 2 || !rows.length) return [];
    
    // For simplicity, use first column as labels (x-axis) and second column as values (y-axis)
    return rows.map(row => {
      const chartDataPoint: Record<string, any> = { 
        name: row[columns[0]] || 'Unknown'
      };
      
      // Add all numeric columns as data points
      columns.slice(1).forEach(column => {
        if (typeof row[column] === 'number') {
          chartDataPoint[column] = row[column];
        } else if (typeof row[column] === 'string' && !isNaN(Number(row[column]))) {
          // Try to convert string to number if possible
          chartDataPoint[column] = Number(row[column]);
        } else {
          chartDataPoint[column] = 0;
        }
      });
      
      return chartDataPoint;
    });
  };
  
  const chartData = prepareChartData();
  
  // Get numeric columns for charts
  const numericColumns = columns.slice(1).filter(column => 
    rows.some(row => typeof row[column] === 'number' || 
    (typeof row[column] === 'string' && !isNaN(Number(row[column]))))
  );
  
  const renderChart = () => {
    if (!chartData.length || !numericColumns.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Cannot render chart with this data.</p>
          <p>Make sure you have at least one categorical column and one numeric column.</p>
        </div>
      );
    }
    
    switch (visualizationType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {numericColumns.map((column, index) => (
                <Bar 
                  key={column} 
                  dataKey={column} 
                  fill={COLORS[index % COLORS.length]} 
                  name={column}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {numericColumns.map((column, index) => (
                <Line 
                  key={column} 
                  type="monotone" 
                  dataKey={column} 
                  stroke={COLORS[index % COLORS.length]} 
                  name={column}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        // For pie charts, we can only use one numeric column
        // Use the first numeric column by default
        const pieDataKey = numericColumns[0];
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={pieDataKey}
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
              <Tooltip />
              <Legend />
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
            disabled={!reportData || rows.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={onRunReport}
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>
      
      {visualizationType === 'table' ? renderTableView() : renderChart()}
      
      {reportData && rows.length > 0 && (
        <div className="text-sm text-muted-foreground text-right">
          Total rows: {rows.length}
        </div>
      )}
    </div>
  );
};
