import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CreateRoleDialog } from "@/components/permissions/CreateRoleDialog";
import { PermissionTable } from "@/components/permissions/PermissionTable";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission, TableInfo } from "@/types/permissions";

const PermissionsPage = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [showSelectAll, setShowSelectAll] = useState<boolean>(false);
  
  // Fetch all roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
        
      if (error) throw error;
      return data as Role[];
    },
  });
  
  // Fetch all database tables
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["database_tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_tables_info');
        
      if (error) {
        console.error("Error fetching tables:", error);
        // Fallback to a predefined list of core tables
        return [
          { name: "cases", schema: "public", fields: ["id", "title", "description", "status"] },
          { name: "users", schema: "public", fields: ["id", "name", "email"] },
          { name: "roles", schema: "public", fields: ["id", "name", "description"] },
          { name: "permissions", schema: "public", fields: ["id", "role_id", "module_name"] },
          { name: "case_categories", schema: "public", fields: ["id", "name", "description"] }
        ] as TableInfo[];
      }
      
      return data as TableInfo[];
    },
  });
  
  // Fetch permissions for selected role
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions", selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [] as Permission[];
      
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .eq("role_id", selectedRoleId);
        
      if (error) throw error;
      return (data || []) as Permission[];
    },
    enabled: !!selectedRoleId,
  });
  
  const {
    hasUnsavedChanges,
    expandedTables,
    savePermissionsMutation,
    handleToggleTable,
    handlePermissionChange,
    handleBulkToggleForTable,
    handleSelectAllForTable,
    getEffectivePermission
  } = usePermissions(selectedRoleId, permissions, roles, tables); // Pass tables to usePermissions

  const handleSaveChanges = () => {
    savePermissionsMutation.mutate();
  };

  // Define relevant modules/tables to show
  const relevantTables = tables?.filter(t => 
    !t.name.startsWith('pg_') && 
    !t.name.includes('_audit_') && 
    !t.name.includes('_log')
  ) || [];

  // Filter out system tables and sort by name
  const sortedTables = [...relevantTables].sort((a, b) => a.name.localeCompare(b.name));
  
  const isLoading = rolesLoading || tablesLoading || (!!selectedRoleId && permissionsLoading);
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Permission Matrix</h1>
          <p className="text-muted-foreground">Manage permissions by role and database entity</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="select-all-toggle">Show "Select All" options</Label>
            <Switch 
              id="select-all-toggle"
              checked={showSelectAll} 
              onCheckedChange={setShowSelectAll} 
            />
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            Configure what each role can access across your database tables and fields
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-end mb-6">
                <div className="w-[300px]">
                  <Label htmlFor="role-select" className="mb-2 block">Select Role</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedRoleId} 
                      onValueChange={setSelectedRoleId}
                    >
                      <SelectTrigger id="role-select" className="flex-1">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name} {role.is_system === true && "(System)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <CreateRoleDialog onRoleCreated={setSelectedRoleId} />
                  </div>
                </div>
                
                <Button
                  onClick={handleSaveChanges}
                  disabled={savePermissionsMutation.isPending}
                  className={`ml-auto ${hasUnsavedChanges ? 'animate-pulse' : ''}`}
                >
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </div>
              
              {!selectedRoleId ? (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <p className="text-muted-foreground">Select a role to manage permissions</p>
                </div>
              ) : (
                <div>
                  <PermissionTable 
                    selectedRoleId={selectedRoleId}
                    tables={sortedTables}
                    roles={roles}
                    permissions={permissions}
                    expandedTables={expandedTables}
                    onToggleTable={handleToggleTable}
                    getEffectivePermission={getEffectivePermission}
                    handlePermissionChange={handlePermissionChange}
                    handleSelectAllForTable={handleSelectAllForTable}
                    showSelectAll={showSelectAll}
                  />
                  
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>• <strong>View</strong>: Controls whether the role can see the table/field</p>
                    <p>• <strong>Edit</strong>: Controls whether the role can modify the field</p>
                    <p>• <strong>Delete</strong>: Controls whether the role can delete records</p>
                    <p className="mt-2 border-l-2 pl-3 border-primary/50">
                      <strong>Permission Rules:</strong><br/>
                      - Selecting Edit will automatically select View<br/>
                      - Selecting Delete will automatically select Edit and View<br/>
                      - Deselecting View will deselect Edit and Delete<br/>
                      - Deselecting Edit will deselect Delete
                    </p>
                    <p className="mt-2 border-l-2 pl-3 border-primary/50">
                      <strong>Bulk Toggles:</strong><br/>
                      - Checking a table-level permission applies that permission to all fields<br/>
                      - Individual field permissions can still be manually adjusted afterward
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSaveChanges}
            disabled={savePermissionsMutation.isPending}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" /> Save All Permission Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PermissionsPage;
