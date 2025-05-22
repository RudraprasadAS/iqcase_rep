
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Columns3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ColumnOption {
  key: string;
  label: string;
  table?: string; // Optional table name for joined columns
}

interface ColumnGroup {
  name: string;
  columns: ColumnOption[];
}

interface ColumnSelectorProps {
  availableColumns: ColumnOption[];
  selectedColumns: string[];
  onColumnChange: (columns: string[]) => void;
  relatedTables?: ColumnGroup[];
}

export const ColumnSelector = ({
  availableColumns,
  selectedColumns,
  onColumnChange,
  relatedTables = [],
}: ColumnSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  
  const handleColumnToggle = (column: string) => {
    if (selectedColumns.includes(column)) {
      onColumnChange(selectedColumns.filter(c => c !== column));
    } else {
      onColumnChange([...selectedColumns, column]);
    }
  };
  
  const handleSelectAll = () => {
    const allColumns = [
      ...availableColumns.map(col => col.key),
      ...relatedTables.flatMap(group => group.columns.map(col => col.key))
    ];
    onColumnChange(allColumns);
  };
  
  const handleSelectNone = () => {
    onColumnChange([]);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns3 className="h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-2 flex justify-between items-center border-b">
          <p className="text-sm font-medium">Table Columns</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSelectAll} className="h-8 text-xs">
              All
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSelectNone} className="h-8 text-xs">
              None
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-auto-fit-100">
            <TabsTrigger value="main" className="text-xs">Main Table</TabsTrigger>
            {relatedTables.map(group => (
              <TabsTrigger key={group.name} value={group.name} className="text-xs">
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="main" className="mt-0">
            <ScrollArea className="h-64">
              <div className="p-2 space-y-1">
                {availableColumns.map((column) => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${column.key}`}
                      checked={selectedColumns.includes(column.key)}
                      onCheckedChange={() => handleColumnToggle(column.key)}
                    />
                    <label
                      htmlFor={`column-${column.key}`}
                      className="text-sm flex-grow cursor-pointer py-1"
                    >
                      {column.label || column.key}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {relatedTables.map(group => (
            <TabsContent key={group.name} value={group.name} className="mt-0">
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {group.columns.map((column) => (
                    <div key={column.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`column-${column.key}`}
                        checked={selectedColumns.includes(column.key)}
                        onCheckedChange={() => handleColumnToggle(column.key)}
                      />
                      <label
                        htmlFor={`column-${column.key}`}
                        className="text-sm flex-grow cursor-pointer py-1"
                      >
                        {column.label || column.key}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({column.table || group.name})
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
