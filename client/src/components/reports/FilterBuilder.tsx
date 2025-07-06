
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { ReportFilter, FilterOperator } from '@/types/reports';

interface FilterBuilderProps {
  selectedFields: string[];
  filters: ReportFilter[];
  onAddFilter: () => void;
  onRemoveFilter: (index: number) => void;
  onUpdateFilter: (index: number, key: keyof ReportFilter, value: any) => void;
}

const FILTER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'like', label: 'Contains' },
  { value: 'ilike', label: 'Contains (Case Insensitive)' },
  { value: 'is', label: 'Is (Null/Not Null)' }
];

export const FilterBuilder = ({
  selectedFields,
  filters,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter
}: FilterBuilderProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Applied Filters</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAddFilter}
          disabled={selectedFields.length === 0}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </div>
      
      {filters.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground border rounded-md">
          No filters applied
        </div>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div 
              key={index}
              className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md"
            >
              <div className="col-span-4">
                <Select
                  value={filter.field}
                  onValueChange={(value) => onUpdateFilter(index, 'field', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-3">
                <Select
                  value={filter.operator}
                  onValueChange={(value) => onUpdateFilter(index, 'operator', value as FilterOperator)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPERATORS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-4">
                <Input
                  value={filter.value as string}
                  onChange={(e) => onUpdateFilter(index, 'value', e.target.value)}
                  placeholder="Value"
                />
              </div>
              
              <div className="col-span-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFilter(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
