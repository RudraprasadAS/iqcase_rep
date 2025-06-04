
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataSource, InsightFilter } from '@/types/insights';
import { Filter, Plus, X } from 'lucide-react';

interface FilterBuilderProps {
  dataSource: DataSource | null;
  filters: InsightFilter[];
  onFiltersChange: (filters: InsightFilter[]) => void;
}

export const FilterBuilder = ({
  dataSource,
  filters,
  onFiltersChange
}: FilterBuilderProps) => {
  const [newFilter, setNewFilter] = useState<Partial<InsightFilter>>({
    field: '',
    operator: 'eq',
    value: '',
    logic: 'AND'
  });

  if (!dataSource) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a data source to add filters
          </p>
        </CardContent>
      </Card>
    );
  }

  const addFilter = () => {
    if (newFilter.field && newFilter.operator && newFilter.value) {
      onFiltersChange([...filters, newFilter as InsightFilter]);
      setNewFilter({
        field: '',
        operator: 'eq',
        value: '',
        logic: 'AND'
      });
    }
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const operators = [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not Equals' },
    { value: 'gt', label: 'Greater Than' },
    { value: 'gte', label: 'Greater Than or Equal' },
    { value: 'lt', label: 'Less Than' },
    { value: 'lte', label: 'Less Than or Equal' },
    { value: 'like', label: 'Contains' },
    { value: 'in', label: 'In List' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new filter */}
        <div className="space-y-2">
          <Select
            value={newFilter.field}
            onValueChange={(value) => setNewFilter({ ...newFilter, field: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {dataSource.fields.map((field) => (
                <SelectItem key={field.name} value={field.name}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={newFilter.operator}
            onValueChange={(value) => setNewFilter({ ...newFilter, operator: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select operator" />
            </SelectTrigger>
            <SelectContent>
              {operators.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Filter value"
            value={newFilter.value}
            onChange={(e) => setNewFilter({ ...newFilter, value: e.target.value })}
          />

          <Button onClick={addFilter} size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Add Filter
          </Button>
        </div>

        {/* Current filters */}
        {filters.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Applied Filters</h4>
            {filters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="secondary" className="flex-1">
                  {dataSource.fields.find(f => f.name === filter.field)?.label} {' '}
                  {operators.find(op => op.value === filter.operator)?.label} {' '}
                  "{filter.value}"
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFilter(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
