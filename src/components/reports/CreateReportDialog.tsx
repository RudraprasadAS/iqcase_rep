
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { ReportFilter } from '@/types/reports';

interface CreateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateReportDialog = ({ open, onOpenChange }: CreateReportDialogProps) => {
  const { tables, createReport, isLoadingTables } = useReports();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);

  const getAvailableFields = () => {
    if (!selectedTable || !tables) return [];
    const table = tables.find(t => t.table_name === selectedTable);
    return table?.column_names || [];
  };

  const handleFieldToggle = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter(f => f !== field));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const addFilter = () => {
    const availableFields = getAvailableFields();
    if (availableFields.length === 0) return;
    
    setFilters([...filters, {
      field: availableFields[0],
      operator: 'eq',
      value: ''
    }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: keyof ReportFilter, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  const handleCreate = () => {
    if (!name.trim() || !selectedTable || selectedFields.length === 0) return;
    
    createReport.mutate({
      name: name.trim(),
      description: description.trim(),
      table_name: selectedTable,
      selected_fields: selectedFields,
      filters: filters.filter(f => f.value.trim() !== '')
    });
    
    // Reset form
    setName('');
    setDescription('');
    setSelectedTable('');
    setSelectedFields([]);
    setFilters([]);
    onOpenChange(false);
  };

  const availableFields = getAvailableFields();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Report Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter report name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter report description"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Select Table</Label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a table" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTables ? (
                  <div className="p-2 text-center">Loading...</div>
                ) : (
                  tables?.map((table) => (
                    <SelectItem key={table.table_name} value={table.table_name}>
                      {table.table_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {selectedTable && (
            <div className="space-y-2">
              <Label>Select Fields</Label>
              <div className="border rounded p-4 max-h-40 overflow-y-auto">
                {availableFields.map((field) => (
                  <div key={field} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={field}
                      checked={selectedFields.includes(field)}
                      onCheckedChange={() => handleFieldToggle(field)}
                    />
                    <Label htmlFor={field} className="text-sm">
                      {field}
                    </Label>
                  </div>
                ))}
              </div>
              
              {selectedFields.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedFields.map((field) => (
                    <Badge key={field} variant="secondary">
                      {field}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => handleFieldToggle(field)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {selectedTable && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Filters (Optional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFilter}
                  disabled={availableFields.length === 0}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Filter
                </Button>
              </div>
              
              {filters.map((filter, index) => (
                <div key={index} className="flex gap-2 items-center p-2 border rounded">
                  <Select
                    value={filter.field}
                    onValueChange={(value) => updateFilter(index, 'field', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filter.operator}
                    onValueChange={(value) => updateFilter(index, 'operator', value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eq">=</SelectItem>
                      <SelectItem value="like">contains</SelectItem>
                      <SelectItem value="gt">&gt;</SelectItem>
                      <SelectItem value="lt">&lt;</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    value={filter.value}
                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1"
                  />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeFilter(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !selectedTable || selectedFields.length === 0 || createReport.isPending}
          >
            {createReport.isPending ? 'Creating...' : 'Create Report'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
