import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save, Edit, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CreateRoleDialog } from "@/components/permissions/CreateRoleDialog";
import { PermissionTable } from "@/components/permissions/PermissionTable";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission, TableInfo } from "@/types/permissions";
import { DeleteRoleDialog } from "@/components/roles/DeleteRoleDialog";
import { EditRoleDialog } from "@/components/roles/EditRoleDialog";
import { toast } from "@/hooks/use-toast";

const PermissionsPage = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [showSelectAll, setShowSelectAll] = useState<boolean>(false);
  const [editRoleOpen, setEditRoleOpen] = useState<boolean>(false);
  const [deleteRoleOpen, setDeleteRoleOpen] = useState<boolean>(false);
  const queryClient = useQueryClient();
  
  // Fetch all roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      console.log("Fetching roles from database");
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
        
      if (error) {
        console.error("Error fetching roles:", error);
        throw error;
      }
      
      console.log("Roles fetched successfully:", data);
      return data as Role[];
    },
  });
  
  // Fetch all database tables
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["database_tables"],
    queryFn: async () => {
      console.log("Fetching database tables");
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
      
      console.log("Tables fetched successfully:", data);
      return data as TableInfo[];
    },
  });
  
  // Fetch permissions for selected role
  const { data: permissions, isLoading: permissionsLoading, refetch: refetchPermissions } = useQuery({
    queryKey: ["permissions", selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [] as Permission[];
      
      console.log(`Fetching permissions for role: ${selectedRoleId}`);
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .eq("role_id", selectedRoleId);
        
      if (error) {
        console.error("Error fetching permissions:", error);
        throw error;
      }
      
      console.log(`Permissions fetched for role ${selectedRoleId}:`, data);
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
  } = usePermissions(selectedRoleId, permissions, roles, tables);

  const handleSaveChanges = () => {
    console.log("Saving permission changes...");
    savePermissionsMutation.mutate();
  };

  const handleRoleUpdate = () => {
    console.log("Role updated, refreshing roles list");
    // Refresh roles list
    queryClient.invalidateQueries({ queryKey: ["roles"] });
    
    // Also refresh permissions if a role is selected
    if (selectedRoleId) {
      refetchPermissions();
    }
    
    toast({
      title: "Role updated",
      description: "The role has been updated successfully."
    });
  };

  const handleRoleSelected = (roleId: string) => {
    console.log(`Role selected: ${roleId}`);
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Do you want to discard them?")) {
        setSelectedRoleId(roleId);
      }
    } else {
      setSelectedRoleId(roleId);
    }
  };

  // Log when permissions data changes
  useEffect(() => {
    if (permissions) {
      console.log(`Current permissions for role ${selectedRoleId}:`, permissions);
    }
  }, [permissions, selectedRoleId]);

  const selectedRole = roles?.find(role => role.id === selectedRoleId);

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
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage roles and their permissions across the system</p>
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
          <CardTitle>Role Management & Permissions</CardTitle>
          <CardDescription>
            Create roles and configure what they can access across your database tables and fields
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
                <div className="w-full flex items-end gap-2">
                  <div className="flex-1 max-w-[300px]">
                    <Label htmlFor="role-select" className="mb-2 block">Select Role</Label>
                    <Select 
                      value={selectedRoleId} 
                      onValueChange={handleRoleSelected}
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
                  </div>
                  <CreateRoleDialog onRoleCreated={setSelectedRoleId} />
                  
                  {selectedRole && (
                    <>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => setEditRoleOpen(true)}
                        disabled={selectedRole?.is_system}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setDeleteRoleOpen(true)}
                        disabled={selectedRole?.is_system}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  
                  <Button
                    onClick={handleSaveChanges}
                    disabled={savePermissionsMutation.isPending || !hasUnsavedChanges}
                    className={`ml-auto ${hasUnsavedChanges ? 'animate-pulse' : ''}`}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save Changes
                  </Button>
                </div>
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
                    <p className="mt-2 border-l-2 pl-3 border-primary/50">
                      <strong>Permission Rules:</strong><br/>
                      - Selecting Edit will automatically select View<br/>
                      - Deselecting View will deselect Edit<br/>
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
            disabled={savePermissionsMutation.isPending || !hasUnsavedChanges}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" /> Save All Permission Changes
          </Button>
        </CardFooter>
      </Card>
      
      {/* Role management dialogs */}
      {selectedRole && (
        <>
          <EditRoleDialog 
            role={selectedRole}
            open={editRoleOpen}
            onOpenChange={setEditRoleOpen}
            onSuccess={handleRoleUpdate}
          />
          <DeleteRoleDialog
            role={selectedRole}
            open={deleteRoleOpen}
            onOpenChange={setDeleteRoleOpen}
            onSuccess={handleRoleUpdate}
          />
        </>
      )}
    </div>
  );
};

export default PermissionsPage;
