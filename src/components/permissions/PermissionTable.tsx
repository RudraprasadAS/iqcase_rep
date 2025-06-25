
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

interface PermissionTableProps {
  selectedRoleId: string;
  tables: any[];
  roles?: Role[];
  permissions?: any[];
  expandedTables: Record<string, boolean>;
  onToggleTable: (tableName: string) => void;
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
  handleSelectAllForTable: (
    roleId: string,
    elementKey: string,
    type: 'view' | 'edit',
    checked: boolean
  ) => void;
  showSelectAll: boolean;
  isFrontendMode?: boolean;
}

export const PermissionTable: React.FC<PermissionTableProps> = ({
  selectedRoleId,
  tables,
  roles,
  permissions,
  expandedTables,
  onToggleTable,
  getEffectivePermission,
  handlePermissionChange,
  handleSelectAllForTable,
  showSelectAll,
  isFrontendMode = false
}) => {
  // Debug logging on mount or when permissions change
  useEffect(() => {
    console.log("🔍 [PermissionTable] Rendering with data:");
    console.log("- Selected role ID:", selectedRoleId);
    console.log("- Permissions from DB:", permissions);
    console.log("- Tables structure:", tables);
    console.log("- Frontend mode:", isFrontendMode);
    
    // Log specific permission checks for caseworker role
    if (selectedRoleId && roles) {
      const selectedRole = roles.find(r => r.id === selectedRoleId);
      console.log("- Selected role details:", selectedRole);
      
      // Check specific admin permissions for debugging
      if (selectedRole?.name === 'caseworker') {
        console.log("🔍 [PermissionTable] Checking caseworker admin permissions:");
        console.log("- users_management view:", getEffectivePermission(selectedRoleId, 'users_management', null, 'view'));
        console.log("- permissions_management view:", getEffectivePermission(selectedRoleId, 'permissions_management', null, 'view'));
        console.log("- roles_management view:", getEffectivePermission(selectedRoleId, 'roles_management', null, 'view'));
      }
    }
  }, [permissions, selectedRoleId, tables, roles, getEffectivePermission]);
  
  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-[200px]">
              {isFrontendMode ? "Page / Element" : "Table / Field"}
            </TableHead>
            <TableHead className="text-center w-[100px]">View</TableHead>
            <TableHead className="text-center w-[100px]">Edit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tables.length > 0 ? (
            tables.map(table => (
              <React.Fragment key={table.name}>
                {/* Page/Table-level row */}
                <PermissionRow
                  name={table.name}
                  roleId={selectedRoleId}
                  isTable={true}
                  isExpanded={expandedTables[table.name]}
                  onToggleExpand={() => onToggleTable(table.name)}
                  roles={roles}
                  permissions={permissions}
                  elementKey={table.module}
                  fieldName={null}
                  getEffectivePermission={getEffectivePermission}
                  handlePermissionChange={handlePermissionChange}
                  handleSelectAllForTable={handleSelectAllForTable}
                  showSelectAll={showSelectAll}
                  isFrontendMode={isFrontendMode}
                />
                
                {/* Field-level rows (only show if expanded) */}
                {expandedTables[table.name] && table.fields && table.fields.length > 0 && (
                  table.fields.map((fieldKey: string) => (
                    <PermissionRow
                      key={`${table.name}-${fieldKey}`}
                      name={fieldKey.split('.').pop() || fieldKey} // Show just the field part
                      roleId={selectedRoleId}
                      isTable={false}
                      roles={roles}
                      permissions={permissions}
                      elementKey={table.module}
                      fieldName={fieldKey}
                      getEffectivePermission={getEffectivePermission}
                      handlePermissionChange={handlePermissionChange}
                      isFrontendMode={isFrontendMode}
                    />
                  ))
                )}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                No {isFrontendMode ? 'frontend elements' : 'tables'} found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
