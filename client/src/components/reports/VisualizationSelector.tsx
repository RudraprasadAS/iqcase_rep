
import { Button } from '@/components/ui/button';
import { Table, BarChart, LineChart, PieChart } from 'lucide-react';

interface VisualizationSelectorProps {
  selectedType: 'table' | 'bar' | 'line' | 'pie';
  onTypeChange: (type: 'table' | 'bar' | 'line' | 'pie') => void;
  selectedFields: string[];
}

// This component is now simplified and will be phased out in favor of ChartConfiguration
export const VisualizationSelector = ({ 
  selectedType, 
  onTypeChange,
  selectedFields 
}: VisualizationSelectorProps) => {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-medium">Quick Visualization Type</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedType === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('table')}
          className="flex items-center"
        >
          <Table className="h-4 w-4 mr-2" />
          Table
        </Button>
        <Button
          variant={selectedType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('bar')}
          className="flex items-center"
        >
          <BarChart className="h-4 w-4 mr-2" />
          Bar Chart
        </Button>
        <Button
          variant={selectedType === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('line')}
          className="flex items-center"
        >
          <LineChart className="h-4 w-4 mr-2" />
          Line Chart
        </Button>
        <Button
          variant={selectedType === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onTypeChange('pie')}
          className="flex items-center"
        >
          <PieChart className="h-4 w-4 mr-2" />
          Pie Chart
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Use Chart Configuration below for advanced settings
      </p>
    </div>
  );
};
