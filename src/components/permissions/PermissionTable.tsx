
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
    console.log("PermissionTable rendering with permissions:", permissions);
    console.log("Selected role ID:", selectedRoleId);
    console.log("Expanded tables:", expandedTables);
    console.log("Frontend mode:", isFrontendMode);
    console.log("Tables structure:", tables);
  }, [permissions, selectedRoleId, expandedTables, isFrontendMode, tables]);
  
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
                  getEffectivePermission={getEffectivePermission}
                  handlePermissionChange={handlePermissionChange}
                  showSelectAll={showSelectAll}
                  handleSelectAllForTable={handleSelectAllForTable}
                  isFrontendMode={isFrontendMode}
                  module={table.module}
                />
                
                {/* Field/Element-level rows */}
                {expandedTables[table.name] && table.fields && table.fields.map(field => (
                  <PermissionRow
                    key={`${table.name}-${field}-${selectedRoleId}`}
                    name={field.split('.').pop() || field}
                    roleId={selectedRoleId}
                    isTable={false}
                    fieldName={field}
                    tableName={table.name}
                    roles={roles}
                    permissions={permissions}
                    getEffectivePermission={getEffectivePermission}
                    handlePermissionChange={handlePermissionChange}
                    showSelectAll={false}
                    isFrontendMode={isFrontendMode}
                    module={table.module}
                  />
                ))}
              </React.Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8">
                {isFrontendMode ? "No frontend elements available" : "No tables available"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
