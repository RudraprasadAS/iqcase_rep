
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DataSource, DataField } from '@/types/insights';
import { Columns3, Search } from 'lucide-react';

interface FieldSelectorProps {
  dataSource: DataSource | null;
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

export const FieldSelector = ({
  dataSource,
  selectedFields,
  onFieldsChange
}: FieldSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!dataSource) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Columns3 className="h-5 w-5" />
            Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Select a data source to choose fields
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredFields = dataSource.fields.filter(field =>
    field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFieldToggle = (fieldName: string) => {
    const newFields = selectedFields.includes(fieldName)
      ? selectedFields.filter(f => f !== fieldName)
      : [...selectedFields, fieldName];
    onFieldsChange(newFields);
  };

  const getFieldTypeColor = (type: DataField['type']) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-800';
      case 'number':
      case 'integer': return 'bg-green-100 text-green-800';
      case 'boolean': return 'bg-purple-100 text-purple-800';
      case 'timestamp': return 'bg-orange-100 text-orange-800';
      case 'uuid': return 'bg-gray-100 text-gray-800';
      case 'array': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Columns3 className="h-5 w-5" />
          Fields
        </CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {filteredFields.map((field) => (
              <div key={field.name} className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
                <Checkbox
                  id={field.name}
                  checked={selectedFields.includes(field.name)}
                  onCheckedChange={() => handleFieldToggle(field.name)}
                />
                <Label
                  htmlFor={field.name}
                  className="flex-1 cursor-pointer flex items-center justify-between"
                >
                  <span>{field.label}</span>
                  <Badge className={getFieldTypeColor(field.type)}>
                    {field.type}
                  </Badge>
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {selectedFields.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">
              Selected Fields ({selectedFields.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {selectedFields.map((fieldName) => {
                const field = dataSource.fields.find(f => f.name === fieldName);
                return (
                  <Badge key={fieldName} variant="secondary">
                    {field?.label || fieldName}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
