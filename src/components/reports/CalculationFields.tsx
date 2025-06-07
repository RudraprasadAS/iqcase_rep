
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Calculator } from 'lucide-react';
import { ColumnDefinition } from '@/types/reports';

interface CalculationField {
  id: string;
  name: string;
  operation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'count_distinct';
  field?: string;
  label: string;
}

interface CalculationFieldsProps {
  availableColumns: ColumnDefinition[];
  calculationFields: CalculationField[];
  onCalculationFieldsChange: (fields: CalculationField[]) => void;
  selectedFields: string[];
}

export const CalculationFields = ({
  availableColumns,
  calculationFields,
  onCalculationFieldsChange,
  selectedFields
}: CalculationFieldsProps) => {
  const [newCalculation, setNewCalculation] = useState<Partial<CalculationField>>({
    operation: 'count',
    name: '',
    label: ''
  });

  const operations = [
    { value: 'count', label: 'Count Records', requiresField: false },
    { value: 'count_distinct', label: 'Count Distinct', requiresField: true },
    { value: 'sum', label: 'Sum', requiresField: true },
    { value: 'avg', label: 'Average', requiresField: true },
    { value: 'min', label: 'Minimum', requiresField: true },
    { value: 'max', label: 'Maximum', requiresField: true }
  ];

  const numericColumns = availableColumns.filter(col => 
    ['id', 'number', 'integer', 'decimal', 'float'].some(type => 
      col.name.includes(type) || col.name.endsWith('_id') || col.name.includes('count') || col.name.includes('amount')
    )
  );

  const addCalculationField = () => {
    if (!newCalculation.name || !newCalculation.operation) return;

    const operation = operations.find(op => op.value === newCalculation.operation);
    const requiresField = operation?.requiresField;

    if (requiresField && !newCalculation.field) return;

    const calculationField: CalculationField = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCalculation.name,
      operation: newCalculation.operation as CalculationField['operation'],
      field: newCalculation.field,
      label: newCalculation.label || newCalculation.name
    };

    onCalculationFieldsChange([...calculationFields, calculationField]);
    
    // Reset form
    setNewCalculation({
      operation: 'count',
      name: '',
      label: ''
    });
  };

  const removeCalculationField = (id: string) => {
    onCalculationFieldsChange(calculationFields.filter(field => field.id !== id));
  };

  const updateCalculationField = (id: string, updates: Partial<CalculationField>) => {
    onCalculationFieldsChange(
      calculationFields.map(field => 
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const generateFieldName = (operation: string, field?: string) => {
    if (operation === 'count') return 'total_records';
    if (operation === 'count_distinct' && field) return `distinct_${field}`;
    if (field) return `${operation}_${field}`;
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4" />
        <h3 className="text-sm font-medium">Calculation Fields</h3>
      </div>
      
      {/* Existing calculation fields */}
      {calculationFields.length > 0 && (
        <div className="space-y-2">
          {calculationFields.map((field) => (
            <Card key={field.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{field.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {operations.find(op => op.value === field.operation)?.label}
                      {field.field && ` of ${field.field}`}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCalculationField(field.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add new calculation field */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Calculation Field</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select
                value={newCalculation.operation}
                onValueChange={(value) => {
                  const operation = value as CalculationField['operation'];
                  const generatedName = generateFieldName(operation, newCalculation.field);
                  setNewCalculation({
                    ...newCalculation,
                    operation,
                    name: generatedName,
                    label: operations.find(op => op.value === operation)?.label || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  {operations.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {operations.find(op => op.value === newCalculation.operation)?.requiresField && (
              <div>
                <Label htmlFor="field">Field</Label>
                <Select
                  value={newCalculation.field}
                  onValueChange={(value) => {
                    const generatedName = generateFieldName(newCalculation.operation!, value);
                    setNewCalculation({
                      ...newCalculation,
                      field: value,
                      name: generatedName
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {(newCalculation.operation === 'count_distinct' ? availableColumns : numericColumns).map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="name">Field Name</Label>
            <Input
              id="name"
              value={newCalculation.name}
              onChange={(e) => setNewCalculation({
                ...newCalculation,
                name: e.target.value
              })}
              placeholder="e.g., total_cases"
            />
          </div>

          <div>
            <Label htmlFor="label">Display Label</Label>
            <Input
              id="label"
              value={newCalculation.label}
              onChange={(e) => setNewCalculation({
                ...newCalculation,
                label: e.target.value
              })}
              placeholder="e.g., Total Cases"
            />
          </div>

          <Button
            onClick={addCalculationField}
            disabled={!newCalculation.name || !newCalculation.operation || 
              (operations.find(op => op.value === newCalculation.operation)?.requiresField && !newCalculation.field)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Calculation Field
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
