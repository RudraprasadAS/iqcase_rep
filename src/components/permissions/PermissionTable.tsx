
import React from "react";
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

interface Permission {
  id: string;
  role_id: string;
  module_name: string;
  field_name: string | null;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface PermissionTableProps {
  selectedRoleId: string;
  tables: TableInfo[];
  roles?: Role[];
  permissions?: Permission[];
  expandedTables: Record<string, boolean>;
  onToggleTable: (tableName: string) => void;
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
  handleSelectAllForTable: (
    roleId: string,
    tableName: string,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => void;
  showSelectAll: boolean;
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
  showSelectAll
}) => {
  return (
    <div className="overflow-x-auto border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="min-w-[200px]">Table / Field</TableHead>
            <TableHead className="text-center w-[100px]">View</TableHead>
            <TableHead className="text-center w-[100px]">Edit</TableHead>
            <TableHead className="text-center w-[100px]">Delete</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tables.length > 0 ? (
            tables.map(table => (
              <React.Fragment key={table.name}>
                {/* Table-level row */}
                <PermissionRow
                  name={table.name}
                  roleId={selectedRoleId}
                  isTable={true}
                  isExpanded={expandedTables[table.name]}
                  onToggleExpand={() => onToggleTable(table.name)}
                  roles={roles}
                  permissions={permissions}
                  getEffectivePermission={getEffectivePermission}
                  handlePermissionChange={handlePermissionChange}
                  showSelectAll={showSelectAll}
                  handleSelectAllForTable={handleSelectAllForTable}
                />
                
                {/* Field-level rows */}
                {expandedTables[table.name] && table.fields && table.fields.map(field => (
                  <PermissionRow
                    key={`${table.name}-${field}`}
                    name={field}
                    roleId={selectedRoleId}
                    isTable={false}
                    fieldName={field}
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
              <TableCell colSpan={4} className="text-center py-8">
                No tables available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
