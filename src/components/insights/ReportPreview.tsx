
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChartConfig, ReportExecution } from '@/types/insights';
import { Eye, Loader2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  ResponsiveContainer 
} from 'recharts';

interface ReportPreviewProps {
  data: ReportExecution | null;
  chartConfig: ChartConfig;
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const ReportPreview = ({
  data,
  chartConfig,
  isLoading
}: ReportPreviewProps) => {
  const renderChart = () => {
    if (!data || !data.rows.length) return null;

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
              <Bar dataKey={chartConfig.yAxis} fill="#8884d8" />
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
              <Line type="monotone" dataKey={chartConfig.yAxis} stroke="#8884d8" />
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
              <Area type="monotone" dataKey={chartConfig.yAxis} stroke="#8884d8" fill="#8884d8" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
      case 'donut':
        const pieData = chartData.map((item, index) => ({
          name: item[chartConfig.colorField || chartConfig.xAxis || data.columns[0]],
          value: item[chartConfig.yAxis || data.columns[1]] || 1,
          fill: COLORS[index % COLORS.length]
        }));

        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={chartConfig.type === 'donut' ? 40 : 0}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              {chartConfig.tooltips && <Tooltip />}
              {chartConfig.legend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'kpi':
        const kpiValue = chartData.length;
        return (
          <div className="flex flex-col items-center justify-center h-[300px]">
            <div className="text-4xl font-bold text-primary">{kpiValue}</div>
            <div className="text-lg text-muted-foreground">Total Records</div>
          </div>
        );

      default:
        return renderTable();
    }
  };

  const renderTable = () => {
    if (!data || !data.rows.length) return null;

    return (
      <div className="max-h-[400px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {data.columns.map((column) => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.rows.slice(0, 50).map((row, index) => (
              <TableRow key={index}>
                {data.columns.map((column) => (
                  <TableCell key={column}>
                    {typeof row[column] === 'object' 
                      ? JSON.stringify(row[column]) 
                      : String(row[column] || '')
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.rows.length > 50 && (
          <div className="p-4 text-center text-sm text-muted-foreground border-t">
            Showing first 50 rows of {data.total} total records
          </div>
        )}
      </div>
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
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Running report...</span>
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {data.total} records
                </Badge>
                <Badge variant="outline">
                  {data.columns.length} columns
                </Badge>
              </div>
            </div>
            
            {chartConfig.type === 'table' ? renderTable() : renderChart()}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Run your report to see preview</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
