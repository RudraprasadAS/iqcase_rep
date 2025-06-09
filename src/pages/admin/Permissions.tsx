
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Role } from "@/types/roles";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save, Edit, Trash2, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CreateRoleDialog } from "@/components/permissions/CreateRoleDialog";
import { PermissionTable } from "@/components/permissions/PermissionTable";
import { usePermissions } from "@/hooks/usePermissions";
import { DeleteRoleDialog } from "@/components/roles/DeleteRoleDialog";
import { EditRoleDialog } from "@/components/roles/EditRoleDialog";
import { toast } from "@/hooks/use-toast";

// Comprehensive frontend elements structure covering all application features
const frontendElements = [
  {
    name: "Dashboard",
    type: "page",
    fields: [
      "view_dashboard", 
      "export_dashboard", 
      "customize_dashboard", 
      "view_dashboard_metrics",
      "edit_dashboard_layout",
      "create_dashboard_widgets"
    ]
  },
  {
    name: "Cases",
    type: "page", 
    fields: [
      "view_cases", 
      "create_case", 
      "edit_case", 
      "delete_case", 
      "assign_case", 
      "export_cases",
      "view_case_details",
      "edit_case_title",
      "edit_case_description", 
      "edit_case_status",
      "edit_case_priority",
      "edit_case_category",
      "edit_case_location",
      "edit_case_tags",
      "close_case",
      "reopen_case",
      "archive_case"
    ]
  },
  {
    name: "Case Tasks",
    type: "page",
    fields: [
      "view_case_tasks",
      "create_case_task",
      "edit_case_task", 
      "delete_case_task",
      "assign_case_task",
      "complete_case_task",
      "set_task_due_date",
      "view_task_history"
    ]
  },
  {
    name: "Case Notes",
    type: "page",
    fields: [
      "view_case_notes",
      "add_case_note",
      "edit_case_note",
      "delete_case_note",
      "pin_case_note",
      "view_internal_notes",
      "create_internal_notes"
    ]
  },
  {
    name: "Case Messages",
    type: "page", 
    fields: [
      "view_case_messages",
      "send_internal_message",
      "send_external_message", 
      "edit_message",
      "delete_message",
      "pin_message",
      "view_message_history"
    ]
  },
  {
    name: "Notifications", 
    type: "page",
    fields: [
      "view_notifications",
      "mark_notification_read",
      "delete_notification",
      "create_notification",
      "send_bulk_notifications",
      "configure_notification_settings"
    ]
  },
  {
    name: "Users Management",
    type: "page",
    fields: [
      "view_users", 
      "create_user", 
      "edit_user", 
      "delete_user", 
      "activate_user",
      "deactivate_user",
      "reset_user_password",
      "manage_user_roles",
      "view_user_activity"
    ]
  },
  {
    name: "Roles & Permissions",
    type: "page",
    fields: [
      "view_permissions", 
      "edit_permissions", 
      "create_roles", 
      "delete_roles",
      "edit_roles",
      "assign_permissions",
      "view_role_hierarchy"
    ]
  },
  {
    name: "Reports",
    type: "page",
    fields: [
      "view_reports", 
      "create_reports", 
      "edit_reports", 
      "delete_reports", 
      "export_reports",
      "schedule_reports",
      "share_reports",
      "view_report_analytics"
    ]
  }
];

const PermissionsPage = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [showSelectAll, setShowSelectAll] = useState<boolean>(false);
  const [editRoleOpen, setEditRoleOpen] = useState<boolean>(false);
  const [deleteRoleOpen, setDeleteRoleOpen] = useState<boolean>(false);
  const [registryStatus, setRegistryStatus] = useState<string>("Not started");
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
  
  // Manual function to populate registry
  const populateRegistry = async () => {
    try {
      setRegistryStatus("Populating...");
      console.log("[PermissionsPage] Starting to populate frontend registry");
      
      // First, clear existing entries
      const { error: deleteError } = await supabase
        .from("frontend_registry")
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (deleteError) {
        console.error("[PermissionsPage] Error clearing registry:", deleteError);
        throw deleteError;
      }
      
      // Prepare registry entries
      const registryEntries = [];
      
      frontendElements.forEach(element => {
        const moduleKey = element.name.toLowerCase().replace(/\s+/g, '_').replace(/&/g, 'and');
        
        // Add page-level entry
        registryEntries.push({
          element_key: moduleKey,
          label: element.name,
          module: moduleKey,
          screen: moduleKey,
          element_type: element.type,
          is_active: true
        });
        
        // Add field-level entries
        element.fields.forEach(field => {
          registryEntries.push({
            element_key: `${moduleKey}.${field}`,
            label: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            module: moduleKey,
            screen: moduleKey,
            element_type: 'field',
            is_active: true
          });
        });
      });
      
      console.log("[PermissionsPage] Inserting", registryEntries.length, "registry entries");
      
      // Insert in batches to avoid potential size limits
      const batchSize = 50;
      for (let i = 0; i < registryEntries.length; i += batchSize) {
        const batch = registryEntries.slice(i, i + batchSize);
        const { error } = await supabase
          .from("frontend_registry")
          .insert(batch);
          
        if (error) {
          console.error("[PermissionsPage] Error inserting batch:", error);
          throw error;
        }
      }
      
      setRegistryStatus("Completed");
      toast({
        title: "Frontend Registry Populated",
        description: `Successfully added ${registryEntries.length} frontend elements`
      });
      
      // Refresh the registry query
      queryClient.invalidateQueries({ queryKey: ["frontend_registry"] });
      
    } catch (error) {
      console.error("[PermissionsPage] Error populating registry:", error);
      setRegistryStatus("Error");
      toast({
        title: "Error Populating Registry",
        description: "Failed to populate frontend registry. Check console for details.",
        variant: "destructive"
      });
    }
  };
  
  // Fetch frontend registry entries
  const { data: frontendRegistry, isLoading: registryLoading, refetch: refetchRegistry } = useQuery({
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
        
        console.log("[PermissionsPage] Frontend registry fetched:", data?.length, "elements");
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
        
        console.log(`[PermissionsPage] Permissions fetched for role ${selectedRoleId}:`, data?.length, "permissions");
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
    name: data.page?.label || module.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    schema: 'frontend',
    fields: data.fields.map(field => field.element_key.split('.').pop() || field.element_key),
    module: module,
    registryData: data
  }));
  
  const isLoading = rolesLoading || registryLoading || (!!selectedRoleId && permissionsLoading);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">Manage roles and their permissions across all application features</p>
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
      
      {/* Registry Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Frontend Registry Status
            <Button
              variant="outline"
              size="sm"
              onClick={populateRegistry}
              disabled={registryStatus === "Populating..."}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Populate Registry
            </Button>
          </CardTitle>
          <CardDescription>
            Status: {registryStatus} | Registry Elements: {frontendRegistry?.length || 0} | Tables: {frontendTables.length}
          </CardDescription>
        </CardHeader>
        {frontendRegistry && frontendRegistry.length > 0 && (
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Modules loaded: {Object.keys(groupedRegistry).join(", ")}</p>
            </div>
          </CardContent>
        )}
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Role Management & Permissions</CardTitle>
          <CardDescription>
            Configure comprehensive permissions for all application features
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
                  <p className="text-sm text-muted-foreground mt-2">
                    Registry loaded: {frontendRegistry?.length || 0} elements across {frontendTables.length} modules
                  </p>
                </div>
              ) : frontendTables.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-yellow-50">
                  <p className="text-muted-foreground">No frontend elements found in registry</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click "Populate Registry" above to load frontend elements
                  </p>
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
                    <p>• <strong>View</strong>: Controls whether the role can see the page/feature</p>
                    <p>• <strong>Edit</strong>: Controls whether the role can interact with buttons/actions</p>
                    <p className="mt-2 border-l-2 pl-3 border-primary/50">
                      <strong>Permission Rules:</strong><br/>
                      - Selecting Edit will automatically select View<br/>
                      - Deselecting View will deselect Edit<br/>
                      - System roles have all permissions by default
                    </p>
                    <p className="mt-2 text-xs">
                      Loaded {frontendRegistry?.length || 0} frontend elements | {permissions?.length || 0} saved permissions
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
