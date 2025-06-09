
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2 } from "lucide-react";
import { Role } from "@/types/roles";
import { FrontendRegistryItem } from "@/types/frontend-registry";
import { FrontendPermissionGuard } from "@/components/auth/FrontendPermissionGuard";
import { PermissionTable } from "@/components/permissions/PermissionTable";
import { usePermissions } from "@/hooks/usePermissions";

const PermissionsPage = () => {
  const { toast } = useToast();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Fetch roles
  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("is_active", true)
        .order("name");
        
      if (error) throw error;
      return data as Role[];
    },
  });

  // Fetch frontend registry items
  const { data: registryItems = [] } = useQuery({
    queryKey: ["frontend_registry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frontend_registry")
        .select("*")
        .eq("is_active", true)
        .order("module", { ascending: true })
        .order("screen", { ascending: true })
        .order("element_key", { ascending: true });
        
      if (error) throw error;
      return data as FrontendRegistryItem[];
    },
  });

  // Fetch permissions for selected role
  const { data: permissions = [], isLoading: permissionsLoading } = useQuery({
    queryKey: ["role_permissions", selectedRoleId],
    queryFn: async () => {
      if (!selectedRoleId) return [];
      
      const { data, error } = await supabase
        .from("permissions")
        .select(`
          *,
          frontend_registry:frontend_registry_id (*)
        `)
        .eq("role_id", selectedRoleId);
        
      if (error) throw error;
      return data;
    },
    enabled: !!selectedRoleId,
  });

  // Use the permissions hook
  const {
    hasUnsavedChanges,
    savePermissionsMutation,
    handlePermissionChange,
    getEffectivePermission,
    expandedTables: expandedTablesFromHook,
    handleToggleTable
  } = usePermissions(selectedRoleId, permissions, roles);

  const handleToggleModule = (moduleName: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const handleSave = () => {
    savePermissionsMutation.mutate();
  };

  return (
    <FrontendPermissionGuard elementKey="permission_matrix">
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Frontend Permissions</h1>
            <p className="text-muted-foreground">
              Manage role-based permissions for UI elements using the frontend registry
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {hasUnsavedChanges && (
              <Badge variant="secondary">
                Unsaved changes
              </Badge>
            )}
            <Button 
              onClick={handleSave}
              disabled={!hasUnsavedChanges || savePermissionsMutation.isPending}
            >
              {savePermissionsMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Role Selection</CardTitle>
            <CardDescription>
              Select a role to manage its frontend permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                    {role.is_system && <Badge variant="secondary" className="ml-2">System</Badge>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedRoleId && (
          <Card>
            <CardHeader>
              <CardTitle>Frontend Element Permissions</CardTitle>
              <CardDescription>
                Configure view and edit permissions for UI elements organized by module and screen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissionsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <PermissionTable
                  selectedRoleId={selectedRoleId}
                  registryItems={registryItems}
                  roles={roles}
                  permissions={permissions}
                  expandedModules={expandedModules}
                  onToggleModule={handleToggleModule}
                  getEffectivePermission={getEffectivePermission}
                  handlePermissionChange={handlePermissionChange}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </FrontendPermissionGuard>
  );
};

export default PermissionsPage;
