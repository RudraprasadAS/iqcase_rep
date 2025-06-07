
import { useState } from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Database } from "lucide-react";
import { TableInfo } from '@/types/reports';

interface TableSelectorProps {
  tables: TableInfo[];
  selectedTable: string | null;
  onTableSelect: (tableName: string) => void;
  isLoading: boolean;
}

export const TableSelector = ({
  tables,
  selectedTable,
  onTableSelect,
  isLoading
}: TableSelectorProps) => {
  // Group tables by type/category for better organization
  const groupTables = () => {
    // This is a simple example - in a real app, you might want to have more sophisticated grouping
    const groups: Record<string, TableInfo[]> = {
      "Case Management": [],
      "User Management": [],
      "Other": []
    };
    
    tables.forEach(table => {
      if (table.table_name.startsWith('case_') || table.table_name === 'cases') {
        groups["Case Management"].push(table);
      } else if (table.table_name === 'users' || table.table_name === 'roles' || table.table_name === 'permissions') {
        groups["User Management"].push(table);
      } else {
        groups["Other"].push(table);
      }
    });
    
    return groups;
  };
  
  const tableGroups = groupTables();
  
  // Find the selected table name for display
  const selectedTableInfo = tables.find(t => t.table_name === selectedTable);
  const displayName = selectedTable ? 
    selectedTableInfo ? 
      selectedTable.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 
      selectedTable : 
    'Select a Table';

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Data Source Table</label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between"
            disabled={isLoading}
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span>{displayName}</span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-2 text-center text-sm">Loading tables...</div>
          ) : (
            Object.entries(tableGroups).map(([group, tables]) => (
              tables.length > 0 && (
                <div key={group}>
                  <DropdownMenuGroup>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {group}
                    </div>
                    {tables.map((table) => (
                      <DropdownMenuItem
                        key={table.table_name}
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => onTableSelect(table.table_name)}
                      >
                        <span>{table.table_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                        {selectedTable === table.table_name && (
                          <Check className="h-4 w-4" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </div>
              )
            ))
          )}
          
          {!isLoading && tables.length === 0 && (
            <div className="p-2 text-center text-sm text-muted-foreground">
              No tables available
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
