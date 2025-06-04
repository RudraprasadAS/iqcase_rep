import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataSource, InsightFilter } from '@/types/insights';
import { Filter, Plus, X } from 'lucide-react';

interface FilterBuilderProps {
  dataSource: DataSource | null;
  filters: InsightFilter[];
  onFiltersChange: (filters: InsightFilter[]) => void;
}

const OPERATORS = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'like', label: 'Contains' },
  { value: 'ilike', label: 'Contains (Case Insensitive)' },
  { value: 'is', label: 'Is Null/True/False' }
];

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
    if (newFilter.field && newFilter.operator && newFilter.value !== '') {
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

  const getFieldType = (fieldName: string) => {
    const field = dataSource.fields.find(f => f.name === fieldName);
    return field?.type || 'text';
  };

  const renderValueInput = () => {
    const fieldType = getFieldType(newFilter.field || '');
    
    if (newFilter.operator === 'is') {
      return (
        <Select value={newFilter.value} onValueChange={(value) => setNewFilter({...newFilter, value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">NULL</SelectItem>
            <SelectItem value="true">TRUE</SelectItem>
            <SelectItem value="false">FALSE</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (fieldType === 'boolean') {
      return (
        <Select value={newFilter.value} onValueChange={(value) => setNewFilter({...newFilter, value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (fieldType === 'timestamp') {
      return (
        <Input
          type="datetime-local"
          value={newFilter.value}
          onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
        />
      );
    }

    if (fieldType === 'number' || fieldType === 'integer') {
      return (
        <Input
          type="number"
          placeholder="Enter value"
          value={newFilter.value}
          onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
        />
      );
    }

    return (
      <Input
        placeholder="Enter value"
        value={newFilter.value}
        onChange={(e) => setNewFilter({...newFilter, value: e.target.value})}
      />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Filters */}
        {filters.length > 0 && (
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-accent rounded">
                {index > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {filter.logic}
                  </Badge>
                )}
                <Badge variant="secondary">
                  {dataSource.fields.find(f => f.name === filter.field)?.label || filter.field}
                </Badge>
                <Badge variant="outline">
                  {OPERATORS.find(op => op.value === filter.operator)?.label}
                </Badge>
                <Badge variant="outline">
                  {filter.value}
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

        {/* Add New Filter */}
        <div className="space-y-3 p-3 border rounded">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Field</label>
              <Select 
                value={newFilter.field} 
                onValueChange={(value) => setNewFilter({...newFilter, field: value})}
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
            </div>

            <div>
              <label className="text-sm font-medium">Operator</label>
              <Select 
                value={newFilter.operator} 
                onValueChange={(value) => setNewFilter({...newFilter, operator: value as InsightFilter['operator']})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATORS.map((operator) => (
                    <SelectItem key={operator.value} value={operator.value}>
                      {operator.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm font-medium">Value</label>
              {renderValueInput()}
            </div>

            {filters.length > 0 && (
              <div>
                <label className="text-sm font-medium">Logic</label>
                <Select 
                  value={newFilter.logic} 
                  onValueChange={(value) => setNewFilter({...newFilter, logic: value as 'AND' | 'OR'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">AND</SelectItem>
                    <SelectItem value="OR">OR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Button onClick={addFilter} size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Filter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
