
import { useState, useMemo } from 'react';
import { ChartType } from '@/types/reports';
import {
  BarChart,
  LineChart,
  PieChart,
  Bar,
  Line,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReportChartProps {
  type: ChartType;
  data: any[];
  fields: string[];
}

const COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#a855f7', '#d946ef', '#0ea5e9'];
const DEFAULT_COLOR = '#3b82f6';

const ReportChart = ({ type, data, fields }: ReportChartProps) => {
  const [chartConfig] = useState({
    bar: { color: '#3b82f6' },
    line: { color: '#10b981' },
    pie: { color: COLORS },
  });

  const displayFields = useMemo(() => {
    // For chart display, limit to 1-2 fields at most
    if (type !== 'table' && fields.length > 2) {
      return fields.slice(0, 2);
    }
    return fields;
  }, [type, fields]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  if (type === 'table') {
    return (
      <ScrollArea className="h-full">
        <Table>
          <TableHeader>
            <TableRow>
              {fields.map(field => (
                <TableHead key={field}>{field}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 10).map((row, i) => (
              <TableRow key={i}>
                {fields.map(field => (
                  <TableCell key={`${i}-${field}`}>{row[field]?.toString()}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  }

  // Extract the first field for categories (X axis) and second for values (Y axis)
  const categoryField = displayFields[0] || Object.keys(data[0])[0];
  const valueField = displayFields[1] || Object.keys(data[0])[1] || categoryField;

  const chartData = data.map(item => ({
    name: item[categoryField]?.toString() || 'Unknown',
    value: typeof item[valueField] === 'number' ? item[valueField] : 1,
  }));

  if (type === 'bar') {
    return (
      <ChartContainer
        config={{
          bar: { color: chartConfig.bar.color },
        }}
        className="h-full"
      >
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip
            content={<ChartTooltipContent indicator="line" />}
          />
          <Bar dataKey="value" fill={`${chartConfig.bar.color}`} />
        </BarChart>
      </ChartContainer>
    );
  }

  if (type === 'line') {
    return (
      <ChartContainer
        config={{
          line: { color: chartConfig.line.color },
        }}
        className="h-full"
      >
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={`${chartConfig.line.color}`}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ChartContainer>
    );
  }

  if (type === 'pie') {
    return (
      <ChartContainer
        config={{
          pie: { color: DEFAULT_COLOR },
        }}
        className="h-full"
      >
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={60}
            label
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Legend />
        </PieChart>
      </ChartContainer>
    );
  }

  return null;
};

export default ReportChart;
