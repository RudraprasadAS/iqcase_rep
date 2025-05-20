
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Play, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent 
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { ReportData } from '@/types/reports';

// Define chart colors with proper typing
const chartColors = [
  { color: '#3b82f6' }, // blue-500
  { color: '#ef4444' }, // red-500
  { color: '#10b981' }, // emerald-500
  { color: '#f59e0b' }, // amber-500
  { color: '#6366f1' }  // indigo-500
];

interface ReportPreviewProps {
  reportData: ReportData | null;
  visualizationType: 'table' | 'bar' | 'line' | 'pie';
  isRunning: boolean;
  onRunReport: () => void;
  onExportCsv: () => void;
}

export const ReportPreview = ({
  reportData,
  visualizationType,
  isRunning,
  onRunReport,
  onExportCsv
}: ReportPreviewProps) => {
  if (!reportData) {
    return (
      <div className="text-center py-16 border rounded-md">
        <p className="text-muted-foreground">
          Run the report to see results
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={onRunReport}
          disabled={isRunning}
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Run Report
        </Button>
      </div>
    );
  }
  
  if (reportData.rows.length === 0) {
    return (
      <div className="text-center py-16 border rounded-md">
        <p className="text-muted-foreground">No results found</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            Showing {reportData.rows.length} of {reportData.total} results
          </p>
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onExportCsv}>
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {visualizationType === 'table' && (
        <div className="border rounded-md overflow-auto max-h-96">
          <Table>
            <TableHeader>
              <TableRow>
                {reportData.columns.map((column) => (
                  <TableHead key={column}>
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {reportData.columns.map((column) => (
                    <TableCell key={`${rowIndex}-${column}`}>
                      {row[column]?.toString() || ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {visualizationType === 'bar' && (
        <div className="h-96 border rounded-md p-4">
          <ChartContainer 
            className="w-full"
            config={{ 
              data: "var(--chart-data)", 
              grid: "var(--chart-grid)"
            }}
          >
            <BarChart
              data={reportData.rows}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={reportData.columns[0]}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {reportData.columns.slice(1).map((column, i) => (
                <Bar
                  key={column}
                  dataKey={column}
                  fill={chartColors[i % chartColors.length].color}
                  name={column}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </BarChart>
          </ChartContainer>
        </div>
      )}
      
      {visualizationType === 'line' && (
        <div className="h-96 border rounded-md p-4">
          <ChartContainer 
            className="w-full"
            config={{ 
              data: "var(--chart-data)", 
              grid: "var(--chart-grid)"
            }}
          >
            <LineChart
              data={reportData.rows}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={reportData.columns[0]}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {reportData.columns.slice(1).map((column, i) => (
                <Line
                  key={column}
                  type="monotone"
                  dataKey={column}
                  stroke={chartColors[i % chartColors.length].color}
                  name={column}
                  activeDot={{ r: 8 }}
                />
              ))}
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
          </ChartContainer>
        </div>
      )}
      
      {visualizationType === 'pie' && (
        <div className="h-96 border rounded-md p-4">
          <ChartContainer 
            className="w-full"
            config={{ 
              data: "var(--chart-data)", 
              grid: "var(--chart-grid)"
            }}
          >
            <PieChart>
              <Pie
                data={reportData.rows}
                dataKey={reportData.columns[1]}
                nameKey={reportData.columns[0]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill={chartColors[0].color}
                label
                name={reportData.columns[1]}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </div>
      )}
    </div>
  );
};
