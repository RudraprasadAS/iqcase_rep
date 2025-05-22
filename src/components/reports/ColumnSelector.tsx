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
import { Input } from '@/components/ui/input';

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
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleColumnToggle = (column: string) => {
    if (selectedColumns.includes(column)) {
      onColumnChange(selectedColumns.filter(c => c !== column));
    } else {
      onColumnChange([...selectedColumns, column]);
    }
  };
  
  const handleSelectAll = (tabName?: string) => {
    if (tabName === 'main' || !tabName) {
      // Select all columns from the main table
      const mainColumns = availableColumns.map(col => col.key);
      const existingOtherColumns = selectedColumns.filter(col => col.includes('.'));
      onColumnChange([...mainColumns, ...existingOtherColumns]);
    } else if (tabName === 'all') {
      // Select all columns from all tables
      const allColumns = [
        ...availableColumns.map(col => col.key),
        ...relatedTables.flatMap(group => group.columns.map(col => col.key))
      ];
      onColumnChange(allColumns);
    } else {
      // Select all columns from the specific related table
      const tableColumns = relatedTables
        .find(t => t.name === tabName)
        ?.columns.map(col => col.key) || [];
      
      // Keep existing selections and add the new ones
      const existingOtherColumns = selectedColumns.filter(col => {
        const tablePrefix = col.split('.')[0];
        return tablePrefix !== tabName;
      });
      
      onColumnChange([...existingOtherColumns, ...tableColumns]);
    }
  };
  
  const handleSelectNone = (tabName?: string) => {
    if (tabName === 'main' || !tabName) {
      // Deselect all columns from the main table
      const otherColumns = selectedColumns.filter(col => col.includes('.'));
      onColumnChange(otherColumns);
    } else if (tabName === 'all') {
      // Deselect all columns
      onColumnChange([]);
    } else {
      // Deselect all columns from the specific related table
      onColumnChange(selectedColumns.filter(col => {
        const tablePrefix = col.split('.')[0];
        return tablePrefix !== tabName;
      }));
    }
  };
  
  // Filter columns based on search term
  const filterColumns = (columns: ColumnOption[]) => {
    if (!searchTerm) return columns;
    return columns.filter(col => 
      col.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      col.key.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Count selected columns per tab for badge display
  const getSelectedCount = (tabName: string) => {
    if (tabName === 'main') {
      return selectedColumns.filter(col => !col.includes('.')).length;
    } else {
      return selectedColumns.filter(col => col.startsWith(`${tabName}.`)).length;
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Columns3 className="h-4 w-4" />
          Columns {selectedColumns.length > 0 && `(${selectedColumns.length})`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-2 flex justify-between items-center border-b">
          <p className="text-sm font-medium">Table Columns</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleSelectAll('all')} className="h-8 text-xs">
              All
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleSelectNone('all')} className="h-8 text-xs">
              None
            </Button>
          </div>
        </div>
        
        <div className="p-2 border-b">
          <Input
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-auto-fit-100 sticky top-0 bg-background z-10">
            <TabsTrigger value="main" className="text-xs flex justify-between items-center">
              <span>Main Table</span>
              {getSelectedCount('main') > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-[10px]">
                  {getSelectedCount('main')}
                </span>
              )}
            </TabsTrigger>
            
            {relatedTables.map(group => (
              <TabsTrigger key={group.name} value={group.name} className="text-xs flex justify-between items-center">
                <span>{group.name}</span>
                {getSelectedCount(group.name) > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-[10px]">
                    {getSelectedCount(group.name)}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="main" className="mt-0">
            <div className="p-2 flex justify-between items-center border-b">
              <span className="text-xs text-muted-foreground">
                {filterColumns(availableColumns).length} columns
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleSelectAll('main')} className="h-6 text-xs">
                  Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleSelectNone('main')} className="h-6 text-xs">
                  Clear
                </Button>
              </div>
            </div>
            <ScrollArea className="h-64">
              <div className="p-2 space-y-1">
                {filterColumns(availableColumns).map((column) => (
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
              <div className="p-2 flex justify-between items-center border-b">
                <span className="text-xs text-muted-foreground">
                  {filterColumns(group.columns).length} columns
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleSelectAll(group.name)} className="h-6 text-xs">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleSelectNone(group.name)} className="h-6 text-xs">
                    Clear
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-64">
                <div className="p-2 space-y-1">
                  {filterColumns(group.columns).map((column) => (
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
                        {column.label || column.key.split('.')[1]}
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
