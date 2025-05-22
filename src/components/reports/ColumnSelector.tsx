
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

interface ColumnSelectorProps {
  availableColumns: string[];
  selectedColumns: string[];
  onColumnChange: (columns: string[]) => void;
}

export const ColumnSelector = ({
  availableColumns,
  selectedColumns,
  onColumnChange,
}: ColumnSelectorProps) => {
  const [open, setOpen] = useState(false);
  
  const handleColumnToggle = (column: string) => {
    if (selectedColumns.includes(column)) {
      onColumnChange(selectedColumns.filter(c => c !== column));
    } else {
      onColumnChange([...selectedColumns, column]);
    }
  };
  
  const handleSelectAll = () => {
    onColumnChange(availableColumns);
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
      <PopoverContent className="w-64 p-0" align="end">
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
        <ScrollArea className="h-72">
          <div className="p-2 space-y-1">
            {availableColumns.map((column) => (
              <div key={column} className="flex items-center space-x-2">
                <Checkbox
                  id={`column-${column}`}
                  checked={selectedColumns.includes(column)}
                  onCheckedChange={() => handleColumnToggle(column)}
                />
                <label
                  htmlFor={`column-${column}`}
                  className="text-sm flex-grow cursor-pointer py-1"
                >
                  {column}
                </label>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
