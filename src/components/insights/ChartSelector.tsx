
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChartConfig, DataSource } from '@/types/insights';
import { BarChart3 } from 'lucide-react';

interface ChartSelectorProps {
  chartConfig: ChartConfig;
  onChartConfigChange: (config: ChartConfig) => void;
  availableFields: string[];
  dataSource: DataSource | null;
}

export const ChartSelector = ({
  chartConfig,
  onChartConfigChange,
  availableFields,
  dataSource
}: ChartSelectorProps) => {
  const chartTypes = [
    { value: 'table', label: 'Table' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'pie', label: 'Pie Chart' },
    { value: 'area', label: 'Area Chart' },
    { value: 'donut', label: 'Donut Chart' },
    { value: 'scatter', label: 'Scatter Plot' },
    { value: 'kpi', label: 'KPI Card' }
  ];

  const getFieldOptions = () => {
    if (!dataSource) return [];
    return availableFields.map(fieldName => {
      const field = dataSource.fields.find(f => f.name === fieldName);
      return {
        value: fieldName,
        label: field?.label || fieldName
      };
    });
  };

  const fieldOptions = getFieldOptions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Chart Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Chart Type</Label>
          <Select
            value={chartConfig.type}
            onValueChange={(value) => onChartConfigChange({ ...chartConfig, type: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chartTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {chartConfig.type !== 'table' && chartConfig.type !== 'kpi' && (
          <>
            <div>
              <Label className="text-sm font-medium">X-Axis</Label>
              <Select
                value={chartConfig.xAxis || ''}
                onValueChange={(value) => onChartConfigChange({ ...chartConfig, xAxis: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select X-Axis field" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Y-Axis</Label>
              <Select
                value={chartConfig.yAxis || ''}
                onValueChange={(value) => onChartConfigChange({ ...chartConfig, yAxis: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Y-Axis field" />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map((field) => (
                    <SelectItem key={field.value} value={field.value}>
                      {field.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="labels"
              checked={chartConfig.labels ?? true}
              onCheckedChange={(checked) => onChartConfigChange({ ...chartConfig, labels: checked })}
            />
            <Label htmlFor="labels">Show Labels</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="legend"
              checked={chartConfig.legend ?? true}
              onCheckedChange={(checked) => onChartConfigChange({ ...chartConfig, legend: checked })}
            />
            <Label htmlFor="legend">Show Legend</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="tooltips"
              checked={chartConfig.tooltips ?? true}
              onCheckedChange={(checked) => onChartConfigChange({ ...chartConfig, tooltips: checked })}
            />
            <Label htmlFor="tooltips">Show Tooltips</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
