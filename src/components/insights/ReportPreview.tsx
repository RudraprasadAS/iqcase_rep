
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartConfig, ReportExecution } from '@/types/insights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Eye, Loader2 } from 'lucide-react';

interface ReportPreviewProps {
  data: ReportExecution | null;
  chartConfig: ChartConfig;
  isLoading?: boolean;
}

export const ReportPreview = ({
  data,
  chartConfig,
  isLoading = false
}: ReportPreviewProps) => {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  const renderChart = () => {
    if (!data || !data.rows || data.rows.length === 0) return null;

    const chartData = data.rows;

    switch (chartConfig.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis />
              {chartConfig.tooltips && <Tooltip />}
              {chartConfig.legend && <Legend />}
              <Bar dataKey={chartConfig.yAxis} fill={colors[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis />
              {chartConfig.tooltips && <Tooltip />}
              {chartConfig.legend && <Legend />}
              <Line type="monotone" dataKey={chartConfig.yAxis} stroke={colors[0]} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={chartConfig.xAxis} />
              <YAxis />
              {chartConfig.tooltips && <Tooltip />}
              {chartConfig.legend && <Legend />}
              <Area type="monotone" dataKey={chartConfig.yAxis} stroke={colors[0]} fill={colors[0]} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={chartConfig.type === 'donut' ? 60 : 0}
                outerRadius={80}
                paddingAngle={5}
                dataKey={chartConfig.yAxis}
                nameKey={chartConfig.xAxis}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              {chartConfig.tooltips && <Tooltip />}
              {chartConfig.legend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'kpi':
        const kpiValue = chartData.length > 0 ? Object.values(chartData[0])[0] : 0;
        return (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{String(kpiValue)}</div>
              <div className="text-sm text-muted-foreground">{chartConfig.yAxis || 'Value'}</div>
            </div>
          </div>
        );

      default:
        return renderTable();
    }
  };

  const renderTable = () => {
    if (!data || !data.rows || data.rows.length === 0) return null;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            {data.columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.rows.slice(0, 10).map((row, index) => (
            <TableRow key={index}>
              {data.columns.map((column) => (
                <TableCell key={column}>
                  {row[column] !== null && row[column] !== undefined
                    ? String(row[column])
                    : '-'}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Running report...</span>
          </div>
        ) : data && data.rows && data.rows.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {data.total} record(s) found
            </div>
            {chartConfig.type === 'table' ? renderTable() : renderChart()}
            {chartConfig.type !== 'table' && data.rows.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium">Show Data Table</summary>
                <div className="mt-2 max-h-64 overflow-auto">
                  {renderTable()}
                </div>
              </details>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Run the report to see results</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
