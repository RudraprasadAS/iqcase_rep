
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { FieldPermissionWrapper } from '@/components/auth';

interface FieldSelectorProps {
  availableFields: string[];
  selectedFields: string[];
  onFieldToggle: (field: string) => void;
}

export const FieldSelector = ({ availableFields, selectedFields, onFieldToggle }: FieldSelectorProps) => {
  return (
    <FieldPermissionWrapper elementKey="reports.field_selection" permissionType="edit">
      <div className="space-y-4">
        <div className="grid gap-2">
          <h3 className="text-sm font-medium">Available Fields</h3>
          <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
            {availableFields.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No fields available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableFields.map((field) => (
                  <Button
                    key={field}
                    variant={selectedFields.includes(field) ? "default" : "outline"}
                    size="sm"
                    className="justify-start overflow-hidden text-ellipsis"
                    onClick={() => onFieldToggle(field)}
                  >
                    {field}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid gap-2">
          <h3 className="text-sm font-medium">Selected Fields</h3>
          <div className="border rounded-md p-2 min-h-20">
            {selectedFields.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No fields selected
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedFields.map((field) => (
                  <div
                    key={field}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {field}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                      onClick={() => onFieldToggle(field)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </FieldPermissionWrapper>
  );
};
