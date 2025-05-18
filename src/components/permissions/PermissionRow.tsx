
import React from "react";
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
  can_delete: boolean;
}

interface PermissionRowProps {
  name: string;
  roleId: string;
  isTable: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  fieldName?: string | null;
  roles?: Role[];
  permissions?: Permission[];
  getEffectivePermission: (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit' | 'delete'
  ) => boolean;
  handlePermissionChange: (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => void;
  showSelectAll?: boolean;
  handleSelectAllForTable?: (
    roleId: string,
    tableName: string,
    type: 'view' | 'edit' | 'delete',
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
  roles,
  permissions,
  getEffectivePermission,
  handlePermissionChange,
  showSelectAll,
  handleSelectAllForTable
}) => {
  const isSystemRole = roles?.find(r => r.id === roleId)?.is_system === true;
  
  // Determine the correct moduleName
  const moduleName = isTable ? name : name.split('-')[0];
  
  // Field name should be null for table level, and the actual field name for field level
  const actualFieldName = isTable ? null : name;
  
  // Get the current state of permissions for this row
  const canView = getEffectivePermission(roleId, moduleName, isTable ? null : actualFieldName, 'view');
  const canEdit = getEffectivePermission(roleId, moduleName, isTable ? null : actualFieldName, 'edit');
  const canDelete = getEffectivePermission(roleId, moduleName, isTable ? null : actualFieldName, 'delete');

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
              handlePermissionChange(roleId, moduleName, isTable ? null : actualFieldName, 'view', !!checked);
            }}
            disabled={isSystemRole}
          />
          {isTable && showSelectAll && handleSelectAllForTable && (
            <Button 
              variant="ghost" 
              size="sm"
              className="ml-2 text-xs h-5"
              onClick={() => handleSelectAllForTable(
                roleId, 
                moduleName, 
                'view', 
                !canView
              )}
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
              handlePermissionChange(roleId, moduleName, isTable ? null : actualFieldName, 'edit', !!checked);
            }}
            disabled={isSystemRole}
          />
          {isTable && showSelectAll && handleSelectAllForTable && (
            <Button 
              variant="ghost" 
              size="sm"
              className="ml-2 text-xs h-5"
              onClick={() => handleSelectAllForTable(
                roleId, 
                moduleName, 
                'edit', 
                !canEdit
              )}
            >
              all
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center py-2">
        <div className="flex justify-center">
          <Checkbox 
            checked={canDelete}
            onCheckedChange={(checked) => {
              handlePermissionChange(roleId, moduleName, isTable ? null : actualFieldName, 'delete', !!checked);
            }}
            disabled={isSystemRole}
          />
          {isTable && showSelectAll && handleSelectAllForTable && (
            <Button 
              variant="ghost" 
              size="sm"
              className="ml-2 text-xs h-5"
              onClick={() => handleSelectAllForTable(
                roleId, 
                moduleName, 
                'delete', 
                !canDelete
              )}
            >
              all
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
