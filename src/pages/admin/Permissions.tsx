
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2 } from "lucide-react";
import { Role } from "@/types/roles";
import { FrontendRegistryItem, RegistryPermission } from "@/types/frontend-registry";
import { FrontendPermissionGuard } from "@/components/auth/FrontendPermissionGuard";

const PermissionsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [unsavedChanges, setUnsavedChanges] = useState<Map<string, { canView: boolean; canEdit: boolean }>>(new Map());

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
      return data as RegistryPermission[];
    },
    enabled: !!selectedRoleId,
  });

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      const permissionsToSave = Array.from(unsavedChanges.entries()).map(([registryId, perms]) => ({
        role_id: selectedRoleId,
        frontend_registry_id: registryId,
        can_view: perms.canView,
        can_edit: perms.canEdit
      }));

      if (permissionsToSave.length === 0) return;

      const { error } = await supabase
        .from("permissions")
        .upsert(permissionsToSave, {
          onConflict: 'role_id,frontend_registry_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Permissions saved",
        description: "All permission changes have been saved successfully."
      });
      setUnsavedChanges(new Map());
      queryClient.invalidateQueries({ queryKey: ["role_permissions", selectedRoleId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving permissions",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getEffectivePermission = (registryId: string, type: 'view' | 'edit'): boolean => {
    const unsaved = unsavedChanges.get(registryId);
    if (unsaved) {
      return type === 'view' ? unsaved.canView : unsaved.canEdit;
    }

    const permission = permissions.find(p => p.frontend_registry_id === registryId);
    return permission ? (type === 'view' ? permission.can_view : permission.can_edit) : false;
  };

  const handlePermissionChange = (registryId: string, type: 'view' | 'edit', checked: boolean) => {
    const current = unsavedChanges.get(registryId) || {
      canView: getEffectivePermission(registryId, 'view'),
      canEdit: getEffectivePermission(registryId, 'edit')
    };

    let newPerms = { ...current };
    
    if (type === 'view') {
      newPerms.canView = checked;
      if (!checked) {
        newPerms.canEdit = false; // Can't edit without view
      }
    } else if (type === 'edit') {
      newPerms.canEdit = checked;
      if (checked) {
        newPerms.canView = true; // Must have view to edit
      }
    }

    setUnsavedChanges(prev => new Map(prev.set(registryId, newPerms)));
  };

  // Group registry items by module and screen
  const groupedItems = registryItems.reduce((acc, item) => {
    if (!acc[item.module]) acc[item.module] = {};
    if (!acc[item.module][item.screen]) acc[item.module][item.screen] = [];
    acc[item.module][item.screen].push(item);
    return acc;
  }, {} as Record<string, Record<string, FrontendRegistryItem[]>>);

  const hasUnsavedChanges = unsavedChanges.size > 0;

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
                {unsavedChanges.size} unsaved changes
              </Badge>
            )}
            <Button 
              onClick={() => savePermissionsMutation.mutate()}
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
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([module, screens]) => (
                    <div key={module} className="border rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-4">{module}</h3>
                      
                      {Object.entries(screens).map(([screen, items]) => (
                        <div key={screen} className="mb-4">
                          <h4 className="text-md font-medium mb-2 text-muted-foreground">{screen}</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map((item) => (
                              <div key={item.id} className="border rounded p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{item.label || item.element_key}</span>
                                  <Badge variant="outline">{item.element_type}</Badge>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${item.id}-view`}
                                      checked={getEffectivePermission(item.id, 'view')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(item.id, 'view', checked as boolean)
                                      }
                                    />
                                    <label htmlFor={`${item.id}-view`} className="text-sm">View</label>
                                  </div>
                                  
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${item.id}-edit`}
                                      checked={getEffectivePermission(item.id, 'edit')}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(item.id, 'edit', checked as boolean)
                                      }
                                    />
                                    <label htmlFor={`${item.id}-edit`} className="text-sm">Edit</label>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </FrontendPermissionGuard>
  );
};

export default PermissionsPage;
