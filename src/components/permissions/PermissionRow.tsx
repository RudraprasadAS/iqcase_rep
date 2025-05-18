
import React, { useEffect } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Role } from "@/types/roles";

interface Permission {
  id: string;
  role_id: string;
  module_name: string;
  field_name: string | null;
  can_view: boolean;
  can_edit: boolean;
}

interface PermissionRowProps {
  name: string;
  roleId: string;
  isTable: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  fieldName?: string | null;
  tableName?: string;
  roles?: Role[];
  permissions?: Permission[];
  getEffectivePermission: (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit'
  ) => boolean;
  handlePermissionChange: (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit',
    checked: boolean
  ) => void;
  showSelectAll?: boolean;
  handleSelectAllForTable?: (
    roleId: string,
    tableName: string,
    type: 'view' | 'edit',
    checked: boolean
  ) => void;
}

export const PermissionRow: React.FC<PermissionRowProps> = ({
  name,
  roleId,
  isTable,
  isExpanded,
  onToggleExpand,
  fieldName = null,
  tableName,
  roles,
  permissions,
  getEffectivePermission,
  handlePermissionChange,
  showSelectAll,
  handleSelectAllForTable
}) => {
  const isSystemRole = roles?.find(r => r.id === roleId)?.is_system === true;
  
  // Determine the correct moduleName based on whether this is a table or field level row
  const moduleName = isTable ? name : tableName || name;
  
  // For field rows, we need the actual field name (not the full string with module name)
  const actualFieldName = isTable ? null : fieldName;
  
  // Get the current state of permissions for this row
  const canView = getEffectivePermission(roleId, moduleName, actualFieldName, 'view');
  const canEdit = getEffectivePermission(roleId, moduleName, actualFieldName, 'edit');

  // Debug permissions
  useEffect(() => {
    const rowType = isTable ? "Table" : "Field";
    const rowId = isTable ? name : `${moduleName}.${actualFieldName}`;
    
    console.log(`[PermissionRow] ${rowType} "${rowId}" permissions: view=${canView}, edit=${canEdit}`);
    
    // Check for potential duplicate permissions in the data
    if (permissions) {
      const duplicates = permissions.filter(
        p => p.role_id === roleId && 
             p.module_name === moduleName && 
             p.field_name === actualFieldName
      );
      
      if (duplicates.length > 1) {
        console.warn(`[PermissionRow] WARNING: Found ${duplicates.length} duplicate permissions for ${rowType} "${rowId}"!`, duplicates);
      }
    }
  }, [canView, canEdit, name, moduleName, actualFieldName, isTable, roleId, permissions]);

  // Handle checking logic with enforced relationships
  const handleCheck = (type: 'view' | 'edit', checked: boolean) => {
    console.log(`[PermissionRow] Permission change request: ${isTable ? 'table' : 'field'} ${moduleName}${actualFieldName ? '.' + actualFieldName : ''}, ${type}=${checked}`);
    
    // For table level permissions, use the select all handler if provided
    if (isTable && handleSelectAllForTable) {
      console.log(`[PermissionRow] Using selectAll handler for table ${moduleName}`);
      handleSelectAllForTable(roleId, moduleName, type, checked);
    } else {
      // For field level or when select all is not enabled
      console.log(`[PermissionRow] Using regular permission handler for ${isTable ? 'table' : 'field'} ${moduleName}${actualFieldName ? '.' + actualFieldName : ''}`);
      handlePermissionChange(roleId, moduleName, actualFieldName, type, checked);
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
          name
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
                handleSelectAllForTable(roleId, moduleName, 'view', !canView)}
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
                handleSelectAllForTable(roleId, moduleName, 'edit', !canEdit)}
            >
              all
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
