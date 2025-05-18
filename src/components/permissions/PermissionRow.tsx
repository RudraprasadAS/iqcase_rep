
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
  const tableName = isTable ? name : "";
  const isSystemRole = roles?.find(r => r.id === roleId)?.is_system === true;
  const moduleName = isTable ? name : name.split('-')[0];
  
  // Get the current state of permissions for this row
  const canView = getEffectivePermission(roleId, tableName || moduleName, fieldName, 'view');
  const canEdit = getEffectivePermission(roleId, tableName || moduleName, fieldName, 'edit');
  const canDelete = getEffectivePermission(roleId, tableName || moduleName, fieldName, 'delete');

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
              handlePermissionChange(roleId, tableName || moduleName, fieldName, 'view', !!checked);
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
                name, 
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
              handlePermissionChange(roleId, tableName || moduleName, fieldName, 'edit', !!checked);
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
                name, 
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
              handlePermissionChange(roleId, tableName || moduleName, fieldName, 'delete', !!checked);
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
                name, 
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
