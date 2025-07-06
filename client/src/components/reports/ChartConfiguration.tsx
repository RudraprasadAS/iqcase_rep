
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, PieChart, Table } from 'lucide-react';
import { ColumnDefinition } from '@/types/reports';

interface ChartConfig {
  type: 'table' | 'bar' | 'line' | 'pie';
  xAxis?: string;
  yAxis?: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
  dateGrouping?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

interface ChartConfigurationProps {
  availableColumns: ColumnDefinition[];
  selectedFields: string[];
  chartConfig: ChartConfig;
  onChartConfigChange: (config: ChartConfig) => void;
}

export const ChartConfiguration = ({
  availableColumns,
  selectedFields,
  chartConfig,
  onChartConfigChange
}: ChartConfigurationProps) => {
  const chartTypes = [
    { value: 'table', label: 'Table View', icon: Table, description: 'Show data in tabular format' },
    { value: 'bar', label: 'Bar Chart', icon: BarChart, description: 'Compare values across categories' },
    { value: 'line', label: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
    { value: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions of a whole' }
  ];

  const aggregationOptions = [
    { value: 'count', label: 'Count of Records' },
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' }
  ];

  const dateGroupingOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
    { value: 'year', label: 'Yearly' }
  ];

  // Get columns that could be used for different purposes
  const categoricalColumns = availableColumns.filter(col => 
    !['id', 'created_at', 'updated_at'].includes(col.key) &&
    !col.key.includes('_id') &&
    !isNumericField(col.key) &&
    !isDateField(col.key)
  );

  const numericColumns = availableColumns.filter(col => 
    isNumericField(col.key) || col.key.includes('count') || col.key.includes('amount')
  );

  const timeColumns = availableColumns.filter(col => 
    isDateField(col.key)
  );

  function isNumericField(fieldName: string): boolean {
    const numericIndicators = ['id', 'count', 'amount', 'price', 'total', 'sum', 'avg', 'min', 'max', 'number', 'duration'];
    return numericIndicators.some(indicator => fieldName.toLowerCase().includes(indicator));
  }

  function isDateField(fieldName: string): boolean {
    const dateIndicators = ['date', 'time', 'created', 'updated', '_at'];
    return dateIndicators.some(indicator => fieldName.toLowerCase().includes(indicator));
  }

  const updateChartConfig = (updates: Partial<ChartConfig>) => {
    onChartConfigChange({ ...chartConfig, ...updates });
  };

  const requiresAxes = chartConfig.type !== 'table';
  const isPieChart = chartConfig.type === 'pie';
  const isSelectedFieldDate = chartConfig.xAxis && isDateField(chartConfig.xAxis);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Chart Configuration</h3>
      
      {/* Chart Type Selection */}
<Card>
  <CardHeader>
    <CardTitle className="text-sm">Visualization Type</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-3">
      {chartTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = chartConfig.type === type.value;

        return (
<Button
  key={type.value}
  variant="outline"
  className={`h-auto p-3 flex flex-col items-center gap-2 rounded-md border 
    ${chartConfig.type === type.value 
      ? 'bg-gray-100 text-foreground border-gray-400' 
      : 'bg-white text-foreground hover:bg-gray-50'}`}
  onClick={() => updateChartConfig({ type: type.value as ChartConfig['type'] })}
>
  <Icon className="h-5 w-5" />
  <div className="text-center w-full overflow-hidden text-ellipsis break-words">
  <div className="font-medium text-xs leading-tight">{type.label}</div>
  <div className="text-xs text-muted-foreground leading-snug break-words">
    {type.description}
  </div>
</div>
</Button>

        );
      })}
    </div>
  </CardContent>
</Card>


      {/* Axis Configuration */}
      {requiresAxes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {isPieChart ? 'Chart Data' : 'Axis Configuration'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isPieChart ? (
              <>
                {/* X-Axis */}
                <div>
                  <Label htmlFor="x-axis">X-Axis (Categories)</Label>
                  <Select
                    value={chartConfig.xAxis || ''}
                    onValueChange={(value) => updateChartConfig({ xAxis: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field for X-axis" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoricalColumns.map((col) => (
                        <SelectItem key={col.key} value={col.key}>
                          {col.label}
                        </SelectItem>
                      ))}
                      {timeColumns.map((col) => (
                        <SelectItem key={col.key} value={col.key}>
                          {col.label} (Date/Time)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose a categorical field or date field for grouping
                  </p>
                </div>

                {/* Date Grouping - Show only if a date field is selected for X-axis */}
                {isSelectedFieldDate && (
                  <div>
                    <Label htmlFor="date-grouping">Date Grouping</Label>
                    <Select
                      value={chartConfig.dateGrouping || 'month'}
                      onValueChange={(value) => updateChartConfig({ dateGrouping: value as ChartConfig['dateGrouping'] })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date grouping" />
                      </SelectTrigger>
                      <SelectContent>
                        {dateGroupingOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Group dates by time period for better visualization
                    </p>
                  </div>
                )}

                {/* Y-Axis */}
                <div>
                  <Label htmlFor="y-axis">Y-Axis (Values)</Label>
                  <div className="flex gap-2">
                    <Select
                      value={chartConfig.aggregation || 'count'}
                      onValueChange={(value) => updateChartConfig({ aggregation: value as ChartConfig['aggregation'] })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Aggregation" />
                      </SelectTrigger>
                      <SelectContent>
                        {aggregationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={chartConfig.yAxis || ''}
                      onValueChange={(value) => updateChartConfig({ yAxis: value || undefined })}
                      disabled={chartConfig.aggregation === 'count'}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select field for Y-axis" />
                      </SelectTrigger>
                      <SelectContent>
                        {numericColumns.map((col) => (
                          <SelectItem key={col.key} value={col.key}>
                            {col.label}
                          </SelectItem>
                        ))}
                        {availableColumns.map((col) => (
                          <SelectItem key={`all-${col.key}`} value={col.key}>
                            {col.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {chartConfig.aggregation === 'count' 
                      ? 'Count aggregation doesn\'t need a specific field'
                      : 'Choose how to aggregate the Y-axis values'
                    }
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Pie Chart Configuration */}
                <div>
                  <Label htmlFor="pie-category">Category Field</Label>
                  <Select
                    value={chartConfig.xAxis || ''}
                    onValueChange={(value) => updateChartConfig({ xAxis: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field for pie slices" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoricalColumns.map((col) => (
                        <SelectItem key={col.key} value={col.key}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="pie-value">Value Calculation</Label>
                  <Select
                    value={chartConfig.aggregation || 'count'}
                    onValueChange={(value) => updateChartConfig({ aggregation: value as ChartConfig['aggregation'] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How to calculate slice sizes" />
                    </SelectTrigger>
                    <SelectContent>
                      {aggregationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Configuration Summary */}
      {chartConfig.type !== 'table' && (
        <Card>
          <CardContent className="pt-4">
            <h4 className="text-sm font-medium mb-2">Chart Preview</h4>
            <div className="text-sm text-muted-foreground">
              {chartConfig.type === 'pie' ? (
                <p>
                  Pie chart showing{' '}
                  <span className="font-medium">{chartConfig.aggregation || 'count'}</span>
                  {chartConfig.xAxis && (
                    <>
                      {' '}by <span className="font-medium">{availableColumns.find(col => col.key === chartConfig.xAxis)?.label}</span>
                    </>
                  )}
                </p>
              ) : (
                <p>
                  {chartConfig.type === 'bar' ? 'Bar' : 'Line'} chart with{' '}
                  {chartConfig.xAxis && (
                    <span className="font-medium">{availableColumns.find(col => col.key === chartConfig.xAxis)?.label}</span>
                  )}
                  {isSelectedFieldDate && chartConfig.dateGrouping && (
                    <span className="font-medium"> ({chartConfig.dateGrouping})</span>
                  )}
                  {' '}on X-axis and{' '}
                  <span className="font-medium">{chartConfig.aggregation || 'count'}</span>
                  {chartConfig.yAxis && chartConfig.aggregation !== 'count' && (
                    <>
                      {' '}of <span className="font-medium">{availableColumns.find(col => col.key === chartConfig.yAxis)?.label}</span>
                    </>
                  )}
                  {' '}on Y-axis
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
