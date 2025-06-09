
import React, { useEffect } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Role } from "@/types/roles";

interface PermissionRowProps {
  name: string;
  roleId: string;
  isTable: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  fieldName?: string | null;
  tableName?: string;
  module?: string;
  roles?: Role[];
  permissions?: any[];
  getEffectivePermission: (
    roleId: string,
    elementKey: string,
    fieldName: string | null,
    type: 'view' | 'edit'
  ) => boolean;
  handlePermissionChange: (
    roleId: string,
    elementKey: string,
    fieldName: string | null,
    type: 'view' | 'edit',
    checked: boolean
  ) => void;
  showSelectAll?: boolean;
  handleSelectAllForTable?: (
    roleId: string,
    elementKey: string,
    type: 'view' | 'edit',
    checked: boolean
  ) => void;
  isFrontendMode?: boolean;
}

export const PermissionRow: React.FC<PermissionRowProps> = ({
  name,
  roleId,
  isTable,
  isExpanded,
  onToggleExpand,
  fieldName = null,
  tableName,
  module,
  roles,
  permissions,
  getEffectivePermission,
  handlePermissionChange,
  showSelectAll,
  handleSelectAllForTable,
  isFrontendMode = false
}) => {
  const isSystemRole = roles?.find(r => r.id === roleId)?.is_system === true;
  
  // Determine the correct element key based on frontend vs backend mode
  let elementKey: string;
  
  if (isFrontendMode) {
    if (isTable) {
      // For page-level permissions, use the module name directly
      elementKey = module || name.toLowerCase().replace(/\s+/g, '_');
    } else {
      // For field-level permissions, we need to use the full element key
      // The fieldName should already contain the full key from the registry
      elementKey = fieldName || `${module || tableName?.toLowerCase().replace(/\s+/g, '_')}.${name}`;
    }
  } else {
    // Legacy backend mode
    elementKey = isTable ? name : tableName || name;
  }
  
  // For field rows in frontend mode, we don't need to pass fieldName separately
  // since the elementKey already contains the full path
  const actualFieldName = isFrontendMode ? null : (isTable ? null : fieldName);
  
  // Get the current state of permissions for this row
  const canView = getEffectivePermission(roleId, elementKey, actualFieldName, 'view');
  const canEdit = getEffectivePermission(roleId, elementKey, actualFieldName, 'edit');

  // Debug permissions
  useEffect(() => {
    const rowType = isTable ? (isFrontendMode ? "Page" : "Table") : (isFrontendMode ? "Element" : "Field");
    const rowId = isTable ? name : elementKey;
    
    console.log(`[PermissionRow] ${rowType} "${rowId}" permissions: view=${canView}, edit=${canEdit}`);
    console.log(`[PermissionRow] Element key: ${elementKey}, Field: ${actualFieldName}, IsTable: ${isTable}`);
  }, [canView, canEdit, name, elementKey, actualFieldName, isTable, roleId, permissions, isFrontendMode]);

  // Handle checking logic with enforced relationships
  const handleCheck = (type: 'view' | 'edit', checked: boolean) => {
    console.log(`[PermissionRow] Permission change request: ${isTable ? (isFrontendMode ? 'page' : 'table') : (isFrontendMode ? 'element' : 'field')} ${elementKey}, ${type}=${checked}`);
    
    // For page/table level permissions, use the select all handler if provided
    if (isTable && handleSelectAllForTable) {
      console.log(`[PermissionRow] Using selectAll handler for ${isFrontendMode ? 'page' : 'table'} ${elementKey}`);
      handleSelectAllForTable(roleId, elementKey, type, checked);
    } else {
      // For field/element level or when select all is not enabled
      console.log(`[PermissionRow] Using regular permission handler for ${isTable ? (isFrontendMode ? 'page' : 'table') : (isFrontendMode ? 'element' : 'field')} ${elementKey}`);
      handlePermissionChange(roleId, elementKey, actualFieldName, type, checked);
    }
  };

  return (
    <TableRow className={isTable ? "bg-muted/20 hover:bg-muted/30" : "border-0"}>
      <TableCell className={isTable ? "font-medium" : "pl-10 py-2 text-sm"}>
        {isTable ? (
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm"
              className="p-1 mr-2"
              onClick={onToggleExpand}
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
            <span className="font-semibold">{name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">
            {isFrontendMode ? 
              (fieldName?.split('.').pop()?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || name) :
              (fieldName?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || name)
            }
          </span>
        )}
      </TableCell>
      <TableCell className="text-center py-2">
        <div className="flex justify-center">
          <Checkbox 
            checked={canView}
            onCheckedChange={(checked) => {
              handleCheck('view', !!checked);
            }}
            disabled={isSystemRole}
          />
          {isTable && showSelectAll && !isSystemRole && (
            <Button 
              variant="ghost" 
              size="sm"
              className="ml-2 text-xs h-5"
              onClick={() => handleSelectAllForTable && 
                handleSelectAllForTable(roleId, elementKey, 'view', !canView)}
            >
              all
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center py-2">
        <div className="flex justify-center">
          <Checkbox 
            checked={canEdit}
            onCheckedChange={(checked) => {
              handleCheck('edit', !!checked);
            }}
            disabled={isSystemRole}
          />
          {isTable && showSelectAll && !isSystemRole && (
            <Button 
              variant="ghost" 
              size="sm"
              className="ml-2 text-xs h-5"
              onClick={() => handleSelectAllForTable && 
                handleSelectAllForTable(roleId, elementKey, 'edit', !canEdit)}
            >
              all
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
