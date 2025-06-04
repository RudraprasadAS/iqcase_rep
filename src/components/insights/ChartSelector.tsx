
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChartConfig, DataSource } from '@/types/insights';
import { BarChart3, LineChart, PieChart, Table } from 'lucide-react';

interface ChartSelectorProps {
  chartConfig: ChartConfig;
  onChartConfigChange: (config: ChartConfig) => void;
  availableFields: string[];
  dataSource: DataSource | null;
}

const CHART_TYPES = [
  { value: 'table', label: 'Table', icon: Table },
  { value: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'pie', label: 'Pie Chart', icon: PieChart },
  { value: 'area', label: 'Area Chart', icon: BarChart3 },
  { value: 'donut', label: 'Donut Chart', icon: PieChart },
  { value: 'kpi', label: 'KPI Card', icon: Table }
];

export const ChartSelector = ({
  chartConfig,
  onChartConfigChange,
  availableFields,
  dataSource
}: ChartSelectorProps) => {
  const updateConfig = (updates: Partial<ChartConfig>) => {
    onChartConfigChange({ ...chartConfig, ...updates });
  };

  const getFieldOptions = () => {
    if (!dataSource) return [];
    
    return availableFields.map(fieldName => {
      const field = dataSource.fields.find(f => f.name === fieldName);
      return {
        value: fieldName,
        label: field?.label || fieldName,
        type: field?.type
      };
    });
  };

  const needsAxes = ['bar', 'line', 'area', 'scatter'].includes(chartConfig.type);
  const needsColorField = ['pie', 'donut'].includes(chartConfig.type);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Visualization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Chart Type</Label>
          <Select 
            value={chartConfig.type} 
            onValueChange={(value) => updateConfig({ type: value as ChartConfig['type'] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {needsAxes && (
          <>
            <div>
              <Label className="text-sm font-medium">X-Axis</Label>
              <Select 
                value={chartConfig.xAxis || ''} 
                onValueChange={(value) => updateConfig({ xAxis: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select X-Axis field" />
                </SelectTrigger>
                <SelectContent>
                  {getFieldOptions().map((field) => (
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
                onValueChange={(value) => updateConfig({ yAxis: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Y-Axis field" />
                </SelectTrigger>
                <SelectContent>
                  {getFieldOptions()
                    .filter(field => ['number', 'integer'].includes(field.type || ''))
                    .map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {needsColorField && (
          <div>
            <Label className="text-sm font-medium">Color Field</Label>
            <Select 
              value={chartConfig.colorField || ''} 
              onValueChange={(value) => updateConfig({ colorField: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color field" />
              </SelectTrigger>
              <SelectContent>
                {getFieldOptions().map((field) => (
                  <SelectItem key={field.value} value={field.value}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {chartConfig.type !== 'table' && chartConfig.type !== 'kpi' && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="labels"
                checked={chartConfig.labels ?? true}
                onCheckedChange={(checked) => updateConfig({ labels: checked })}
              />
              <Label htmlFor="labels">Show Labels</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="legend"
                checked={chartConfig.legend ?? true}
                onCheckedChange={(checked) => updateConfig({ legend: checked })}
              />
              <Label htmlFor="legend">Show Legend</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="tooltips"
                checked={chartConfig.tooltips ?? true}
                onCheckedChange={(checked) => updateConfig({ tooltips: checked })}
              />
              <Label htmlFor="tooltips">Show Tooltips</Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
