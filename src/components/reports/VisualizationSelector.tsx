
import { Button } from '@/components/ui/button';

interface VisualizationSelectorProps {
  visualizationType: 'table' | 'bar' | 'line' | 'pie';
  onVisualizationChange: (type: 'table' | 'bar' | 'line' | 'pie') => void;
}

export const VisualizationSelector = ({ 
  visualizationType, 
  onVisualizationChange 
}: VisualizationSelectorProps) => {
  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-medium">Visualization Type</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={visualizationType === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onVisualizationChange('table')}
        >
          Table
        </Button>
        <Button
          variant={visualizationType === 'bar' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onVisualizationChange('bar')}
        >
          Bar Chart
        </Button>
        <Button
          variant={visualizationType === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onVisualizationChange('line')}
        >
          Line Chart
        </Button>
        <Button
          variant={visualizationType === 'pie' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onVisualizationChange('pie')}
        >
          Pie Chart
        </Button>
      </div>
    </div>
  );
};
