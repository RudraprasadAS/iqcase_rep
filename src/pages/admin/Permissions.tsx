
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
import { ModulePermissionTable } from "@/components/permissions/ModulePermissionTable";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/types/permissions";
import { DeleteRoleDialog } from "@/components/roles/DeleteRoleDialog";
import { EditRoleDialog } from "@/components/roles/EditRoleDialog";
import { toast } from "@/hooks/use-toast";
import { moduleRegistry } from "@/config/moduleRegistry";

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
      console.log("[PermissionsPage] Fetching roles from database");
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");
        
      if (error) {
        console.error("[PermissionsPage] Error fetching roles:", error);
        throw error;
      }
      
      console.log("[PermissionsPage] Roles fetched successfully:", data);
      return data as Role[];
    },
  });
  
  // Fetch permissions for selected role
  const { data: permissions, isLoading: permissionsLoading, refetch: refetchPermissions } = useQuery({
    queryKey: ["permissions", selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [] as Permission[];
      
      console.log(`[PermissionsPage] Fetching permissions for role: ${selectedRoleId}`);
      try {
        const { data, error } = await supabase
          .from("permissions")
          .select("*")
          .eq("role_id", selectedRoleId);
          
        if (error) {
          console.error("[PermissionsPage] Error fetching permissions:", error);
          throw error;
        }
        
        console.log(`[PermissionsPage] Permissions fetched for role ${selectedRoleId}:`, data);
        return (data || []) as Permission[];
      } catch (e) {
        console.error("[PermissionsPage] Exception fetching permissions:", e);
        throw e;
      }
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
    getEffectivePermission,
    debugCurrentState
  } = usePermissions(selectedRoleId, permissions, roles, []);

  const handleSaveChanges = () => {
    console.log("[PermissionsPage] Save changes button clicked");
    debugCurrentState();
    savePermissionsMutation.mutate();
  };

  const handleRoleUpdate = () => {
    console.log("[PermissionsPage] Role updated, refreshing roles list");
    queryClient.invalidateQueries({ queryKey: ["roles"] });
    
    if (selectedRoleId) {
      console.log("[PermissionsPage] Refreshing permissions after role update");
      refetchPermissions();
    }
    
    toast({
      title: "Role updated",
      description: "The role has been updated successfully."
    });
  };

  const handleRoleSelected = (roleId: string) => {
    console.log(`[PermissionsPage] Role selected: ${roleId}`);
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Do you want to discard them?")) {
        setSelectedRoleId(roleId);
      }
    } else {
      setSelectedRoleId(roleId);
    }
  };

  useEffect(() => {
    if (permissions) {
      console.log(`[PermissionsPage] Current permissions for role ${selectedRoleId}:`, permissions);
    }
  }, [permissions, selectedRoleId]);

  const selectedRole = roles?.find(role => role.id === selectedRoleId);
  const isLoading = rolesLoading || (!!selectedRoleId && permissionsLoading);
  
  useEffect(() => {
    console.log("[PermissionsPage] Rendering with state:", {
      selectedRoleId,
      hasUnsavedChanges,
      isLoading,
      permissionsCount: permissions?.length,
      moduleCount: moduleRegistry.modules.length
    });
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage roles and their permissions across frontend modules, screens, and fields</p>
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
          <CardTitle>Frontend Module Permissions</CardTitle>
          <CardDescription>
            Configure role permissions for frontend modules, screens, and individual fields. 
            Only features with frontend implementations are shown here.
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
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h3 className="font-semibold text-blue-900 mb-2">Frontend Module Registry</h3>
                    <p className="text-sm text-blue-800">
                      This permissions matrix shows only frontend modules, screens, and fields that have been implemented. 
                      Total modules: <strong>{moduleRegistry.modules.length}</strong>
                    </p>
                    <div className="mt-2 flex gap-4 text-xs text-blue-700">
                      <span>📁 Modules ({moduleRegistry.modules.length})</span>
                      <span>📄 Screens ({moduleRegistry.modules.reduce((acc, m) => acc + m.screens.length, 0)})</span>
                      <span>🔸 Fields ({moduleRegistry.modules.reduce((acc, m) => acc + m.screens.reduce((screenAcc, s) => screenAcc + s.fields.length, 0), 0)})</span>
                    </div>
                  </div>
                  
                  <ModulePermissionTable 
                    selectedRoleId={selectedRoleId}
                    permissions={permissions}
                    getEffectivePermission={getEffectivePermission}
                    handlePermissionChange={handlePermissionChange}
                    showSelectAll={showSelectAll}
                  />
                  
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>• <strong>View</strong>: Controls whether the role can see the module/screen/field</p>
                    <p>• <strong>Edit</strong>: Controls whether the role can modify the field or perform actions</p>
                    <p className="mt-2 border-l-2 pl-3 border-primary/50">
                      <strong>Permission Rules:</strong><br/>
                      - Selecting Edit will automatically select View<br/>
                      - Deselecting View will deselect Edit<br/>
                      - Module permissions cascade to screens and fields
                    </p>
                    <p className="mt-2 border-l-2 pl-3 border-green-500/50">
                      <strong>Frontend Registry:</strong><br/>
                      - Only implemented frontend features are shown<br/>
                      - New screens/fields are automatically added when implemented<br/>
                      - No database-only tables without frontend are displayed
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
