
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Role } from "@/types/roles";

interface PermissionRowProps {
  name: string;
  roleId: string;
  isTable: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  roles?: Role[];
  permissions?: any[];
  elementKey: string;
  fieldName: string | null;
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
  handleSelectAllForTable?: (
    roleId: string,
    elementKey: string,
    type: 'view' | 'edit',
    checked: boolean
  ) => void;
  showSelectAll?: boolean;
  isFrontendMode?: boolean;
}

export const PermissionRow: React.FC<PermissionRowProps> = ({
  name,
  roleId,
  isTable,
  isExpanded,
  onToggleExpand,
  roles,
  permissions,
  elementKey,
  fieldName,
  getEffectivePermission,
  handlePermissionChange,
  handleSelectAllForTable,
  showSelectAll = false,
  isFrontendMode = false
}) => {
  const selectedRole = roles?.find(r => r.id === roleId);
  const isSystemRole = selectedRole?.is_system === true;
  
  // Get current permission states
  const hasViewPermission = getEffectivePermission(roleId, elementKey, fieldName, 'view');
  const hasEditPermission = getEffectivePermission(roleId, elementKey, fieldName, 'edit');
  
  // Debug logging for admin modules
  if (elementKey.includes('management') || elementKey.includes('admin')) {
    console.log(`🔍 [PermissionRow] ${elementKey}${fieldName ? '.' + fieldName : ''} - View: ${hasViewPermission}, Edit: ${hasEditPermission}, Role: ${selectedRole?.name}`);
  }

  const handleViewChange = (checked: boolean) => {
    if (isSystemRole) return;
    console.log(`🔍 [PermissionRow] View change for ${elementKey}${fieldName ? '.' + fieldName : ''}: ${checked}`);
    handlePermissionChange(roleId, elementKey, fieldName, 'view', checked);
  };

  const handleEditChange = (checked: boolean) => {
    if (isSystemRole) return;
    console.log(`🔍 [PermissionRow] Edit change for ${elementKey}${fieldName ? '.' + fieldName : ''}: ${checked}`);
    handlePermissionChange(roleId, elementKey, fieldName, 'edit', checked);
  };

  const handleSelectAllView = (checked: boolean) => {
    if (isSystemRole || !handleSelectAllForTable) return;
    console.log(`🔍 [PermissionRow] Select all view for ${elementKey}: ${checked}`);
    handleSelectAllForTable(roleId, elementKey, 'view', checked);
  };

  const handleSelectAllEdit = (checked: boolean) => {
    if (isSystemRole || !handleSelectAllForTable) return;
    console.log(`🔍 [PermissionRow] Select all edit for ${elementKey}: ${checked}`);
    handleSelectAllForTable(roleId, elementKey, 'edit', checked);
  };

  return (
    <TableRow className={isTable ? "font-medium bg-muted/20" : ""}>
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          {isTable && onToggleExpand && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!isTable && <div className="w-6" />}
          <span className={isTable ? "font-semibold" : "text-sm ml-2"}>
            {name}
          </span>
          {isSystemRole && isTable && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              System
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center py-2">
        <div className="flex items-center justify-center gap-2">
          <Checkbox
            checked={hasViewPermission}
            onCheckedChange={handleViewChange}
            disabled={isSystemRole}
          />
          {isTable && showSelectAll && handleSelectAllForTable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleSelectAllView(!hasViewPermission)}
              disabled={isSystemRole}
            >
              All
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center py-2">
        <div className="flex items-center justify-center gap-2">
          <Checkbox
            checked={hasEditPermission}
            onCheckedChange={handleEditChange}
            disabled={isSystemRole}
          />
          {isTable && showSelectAll && handleSelectAllForTable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleSelectAllEdit(!hasEditPermission)}
              disabled={isSystemRole}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
