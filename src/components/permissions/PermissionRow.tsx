
import React, { useEffect } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Role } from "@/types/roles";

interface Permission {
  id: string;
  role_id: string;
  frontend_registry_id: string;
  can_view: boolean;
  can_edit: boolean;
}

interface PermissionRowProps {
  name: string;
  roleId: string;
  isModule: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  registryId?: string;
  roles?: Role[];
  permissions?: Permission[];
  getEffectivePermission: (
    roleId: string,
    registryId: string,
    type: 'view' | 'edit'
  ) => boolean;
  handlePermissionChange: (
    roleId: string,
    registryId: string,
    type: 'view' | 'edit',
    checked: boolean
  ) => void;
}

export const PermissionRow: React.FC<PermissionRowProps> = ({
  name,
  roleId,
  isModule,
  isExpanded,
  onToggleExpand,
  registryId,
  roles,
  permissions,
  getEffectivePermission,
  handlePermissionChange
}) => {
  const isSystemRole = roles?.find(r => r.id === roleId)?.is_system === true;
  
  // For module rows, we don't have specific permissions (they're just containers)
  const canView = !isModule && registryId ? getEffectivePermission(roleId, registryId, 'view') : false;
  const canEdit = !isModule && registryId ? getEffectivePermission(roleId, registryId, 'edit') : false;

  // Debug permissions
  useEffect(() => {
    const rowType = isModule ? "Module" : "Registry Item";
    const rowId = isModule ? name : `${name} (${registryId})`;
    
    if (!isModule) {
      console.log(`[PermissionRow] ${rowType} "${rowId}" permissions: view=${canView}, edit=${canEdit}`);
    }
  }, [canView, canEdit, name, registryId, isModule, roleId, permissions]);

  // Handle checking logic
  const handleCheck = (type: 'view' | 'edit', checked: boolean) => {
    if (!registryId || isModule) return;
    
    console.log(`[PermissionRow] Permission change request: registry item ${registryId}, ${type}=${checked}`);
    handlePermissionChange(roleId, registryId, type, checked);
  };

  return (
    <TableRow className={isModule ? "bg-muted/20 hover:bg-muted/30" : "border-0"}>
      <TableCell className={isModule ? "font-medium" : "pl-10 py-2 text-sm"}>
        {isModule ? (
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
          <span className="text-sm">{name}</span>
        )}
      </TableCell>
      <TableCell className="text-center py-2">
        {!isModule && (
          <div className="flex justify-center">
            <Checkbox 
              checked={canView}
              onCheckedChange={(checked) => {
                handleCheck('view', !!checked);
              }}
              disabled={isSystemRole}
            />
          </div>
        )}
      </TableCell>
      <TableCell className="text-center py-2">
        {!isModule && (
          <div className="flex justify-center">
            <Checkbox 
              checked={canEdit}
              onCheckedChange={(checked) => {
                handleCheck('edit', !!checked);
              }}
              disabled={isSystemRole}
            />
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};
