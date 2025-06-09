
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
import { DeleteRoleDialog } from "@/components/roles/DeleteRoleDialog";
import { EditRoleDialog } from "@/components/roles/EditRoleDialog";
import { toast } from "@/hooks/use-toast";

// Define frontend elements structure
const frontendElements = [
  {
    name: "Dashboard",
    type: "page",
    fields: ["view_dashboard", "export_dashboard", "customize_dashboard"]
  },
  {
    name: "Cases",
    type: "page", 
    fields: ["view_cases", "create_case", "edit_case", "delete_case", "assign_case", "export_cases"]
  },
  {
    name: "Case Detail",
    type: "page",
    fields: ["view_case_details", "edit_case_title", "edit_case_description", "edit_case_status", "edit_case_priority", "add_case_notes", "view_case_notes", "add_case_messages", "view_case_messages", "upload_attachments", "view_attachments"]
  },
  {
    name: "Users Management",
    type: "page",
    fields: ["view_users", "create_user", "edit_user", "delete_user", "manage_user_roles"]
  },
  {
    name: "Roles & Permissions",
    type: "page",
    fields: ["view_permissions", "edit_permissions", "create_roles", "delete_roles"]
  },
  {
    name: "Reports",
    type: "page",
    fields: ["view_reports", "create_reports", "edit_reports", "delete_reports", "export_reports"]
  },
  {
    name: "Knowledge Base",
    type: "page",
    fields: ["view_knowledge", "create_articles", "edit_articles", "delete_articles"]
  },
  {
    name: "Notifications",
    type: "page",
    fields: ["view_notifications", "mark_read", "delete_notifications"]
  }
];

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
  
  // Populate frontend registry on component mount
  useEffect(() => {
    const populateFrontendRegistry = async () => {
      try {
        console.log("[PermissionsPage] Populating frontend registry with frontend elements");
        
        // Clear existing frontend registry entries
        await supabase.from("frontend_registry").delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Insert frontend elements
        const registryEntries = [];
        
        frontendElements.forEach(element => {
          // Add page-level entry
          registryEntries.push({
            element_key: element.name.toLowerCase().replace(/\s+/g, '_'),
            label: element.name,
            module: element.name.toLowerCase().replace(/\s+/g, '_'),
            screen: element.name.toLowerCase().replace(/\s+/g, '_'),
            element_type: element.type
          });
          
          // Add field-level entries
          element.fields.forEach(field => {
            registryEntries.push({
              element_key: `${element.name.toLowerCase().replace(/\s+/g, '_')}.${field}`,
              label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              module: element.name.toLowerCase().replace(/\s+/g, '_'),
              screen: element.name.toLowerCase().replace(/\s+/g, '_'),
              element_type: 'field'
            });
          });
        });
        
        const { error } = await supabase
          .from("frontend_registry")
          .insert(registryEntries);
          
        if (error) {
          console.error("[PermissionsPage] Error populating frontend registry:", error);
        } else {
          console.log("[PermissionsPage] Frontend registry populated successfully");
        }
      } catch (error) {
        console.error("[PermissionsPage] Exception populating frontend registry:", error);
      }
    };
    
    populateFrontendRegistry();
  }, []);
  
  // Fetch frontend registry entries
  const { data: frontendRegistry, isLoading: registryLoading } = useQuery({
    queryKey: ["frontend_registry"],
    queryFn: async () => {
      console.log("[PermissionsPage] Fetching frontend registry");
      try {
        const { data, error } = await supabase
          .from("frontend_registry")
          .select("*")
          .eq("is_active", true)
          .order("module", { ascending: true })
          .order("element_type", { ascending: true });
          
        if (error) {
          console.error("[PermissionsPage] Error fetching frontend registry:", error);
          throw error;
        }
        
        console.log("[PermissionsPage] Frontend registry fetched successfully:", data);
        return data || [];
      } catch (e) {
        console.error("[PermissionsPage] Exception fetching frontend registry:", e);
        throw e;
      }
    },
  });
  
  // Fetch permissions for selected role
  const { data: permissions, isLoading: permissionsLoading, refetch: refetchPermissions } = useQuery({
    queryKey: ["permissions", selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [];
      
      console.log(`[PermissionsPage] Fetching permissions for role: ${selectedRoleId}`);
      try {
        const { data, error } = await supabase
          .from("permissions")
          .select(`
            *,
            frontend_registry (*)
          `)
          .eq("role_id", selectedRoleId);
          
        if (error) {
          console.error("[PermissionsPage] Error fetching permissions:", error);
          throw error;
        }
        
        console.log(`[PermissionsPage] Permissions fetched for role ${selectedRoleId}:`, data);
        return (data || []);
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
    handleSelectAllForTable,
    getEffectivePermission,
    debugCurrentState
  } = usePermissions(selectedRoleId, permissions, roles, frontendRegistry);

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

  // Log when permissions data changes
  useEffect(() => {
    if (permissions) {
      console.log(`[PermissionsPage] Current permissions for role ${selectedRoleId}:`, permissions);
    }
  }, [permissions, selectedRoleId]);

  const selectedRole = roles?.find(role => role.id === selectedRoleId);

  // Group frontend registry by module for display
  const groupedRegistry = frontendRegistry?.reduce((acc, item) => {
    if (!acc[item.module]) {
      acc[item.module] = { page: null, fields: [] };
    }
    
    if (item.element_type === 'page') {
      acc[item.module].page = item;
    } else {
      acc[item.module].fields.push(item);
    }
    
    return acc;
  }, {} as Record<string, { page: any; fields: any[] }>) || {};

  // Convert to table format for PermissionTable component
  const frontendTables = Object.entries(groupedRegistry).map(([module, data]) => ({
    name: data.page?.label || module,
    schema: 'frontend',
    fields: data.fields.map(field => field.element_key.split('.').pop() || field.element_key),
    module: module,
    registryData: data
  }));
  
  const isLoading = rolesLoading || registryLoading || (!!selectedRoleId && permissionsLoading);
  
  // Debug render
  useEffect(() => {
    console.log("[PermissionsPage] Rendering with state:", {
      selectedRoleId,
      hasUnsavedChanges,
      isLoading,
      permissionsCount: permissions?.length,
      frontendTablesCount: frontendTables.length
    });
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage roles and their permissions across frontend elements</p>
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
            Create roles and configure what they can access across your application's pages, buttons, and fields
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
                    tables={frontendTables}
                    roles={roles}
                    permissions={permissions}
                    expandedTables={expandedTables}
                    onToggleTable={handleToggleTable}
                    getEffectivePermission={getEffectivePermission}
                    handlePermissionChange={handlePermissionChange}
                    handleSelectAllForTable={handleSelectAllForTable}
                    showSelectAll={showSelectAll}
                    isFrontendMode={true}
                  />
                  
                  <div className="mt-6 text-sm text-muted-foreground">
                    <p>• <strong>View</strong>: Controls whether the role can see the page/element</p>
                    <p>• <strong>Edit</strong>: Controls whether the role can interact with buttons/fields</p>
                    <p className="mt-2 border-l-2 pl-3 border-primary/50">
                      <strong>Permission Rules:</strong><br/>
                      - Selecting Edit will automatically select View<br/>
                      - Deselecting View will deselect Edit<br/>
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
