
import React, { useEffect } from "react";
import { 
  Table, 
  TableHeader, 
  TableHead, 
  TableBody, 
  TableRow,
  TableCell 
} from "@/components/ui/table";
import { PermissionRow } from "./PermissionRow";
import { Role } from "@/types/roles";
import { TableInfo } from "@/types/permissions";
import { FrontendRegistryItem } from "@/types/frontend-registry";

interface Permission {
  id: string;
  role_id: string;
  frontend_registry_id: string;
  can_view: boolean;
  can_edit: boolean;
}

interface PermissionTableProps {
  selectedRoleId: string;
  registryItems: FrontendRegistryItem[];
  roles?: Role[];
  permissions?: Permission[];
  expandedModules: Record<string, boolean>;
  onToggleModule: (moduleName: string) => void;
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

export const PermissionTable: React.FC<PermissionTableProps> = ({
  selectedRoleId,
  registryItems,
  roles,
  permissions,
  expandedModules,
  onToggleModule,
  getEffectivePermission,
  handlePermissionChange
}) => {
  // Debug logging on mount or when permissions change
  useEffect(() => {
    console.log("PermissionTable rendering with permissions:", permissions);
    console.log("Selected role ID:", selectedRoleId);
    console.log("Registry items:", registryItems);
  }, [permissions, selectedRoleId, registryItems]);

  // Group registry items by module
  const groupedItems = registryItems.reduce((acc, item) => {
    if (!acc[item.module]) {
      acc[item.module] = [];
    }
    acc[item.module].push(item);
    return acc;
  }, {} as Record<string, FrontendRegistryItem[]>);
  
  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-[200px]">Module / Element</TableHead>
            <TableHead className="text-center w-[100px]">View</TableHead>
            <TableHead className="text-center w-[100px]">Edit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.keys(groupedItems).length > 0 ? (
            Object.entries(groupedItems).map(([module, items]) => (
              <React.Fragment key={module}>
                {/* Module-level row */}
                <PermissionRow
                  name={module}
                  roleId={selectedRoleId}
                  isModule={true}
                  isExpanded={expandedModules[module]}
                  onToggleExpand={() => onToggleModule(module)}
                  roles={roles}
                  permissions={permissions}
                  getEffectivePermission={getEffectivePermission}
                  handlePermissionChange={handlePermissionChange}
                />
                
                {/* Registry item rows */}
                {expandedModules[module] && items.map(item => (
                  <PermissionRow
                    key={`${module}-${item.id}-${selectedRoleId}`}
                    name={`${item.screen} - ${item.label || item.element_key}`}
                    roleId={selectedRoleId}
                    isModule={false}
                    registryId={item.id}
                    roles={roles}
                    permissions={permissions}
                    getEffectivePermission={getEffectivePermission}
                    handlePermissionChange={handlePermissionChange}
                  />
                ))}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8">
                No registry items available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
