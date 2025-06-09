
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Role } from "@/types/roles";
import { Permission, UnsavedPermission } from "@/types/permissions";

export const usePermissions = (selectedRoleId: string, permissions?: Permission[], roles?: Role[]) => {
  const queryClient = useQueryClient();
  const [unsavedChanges, setUnsavedChanges] = useState<UnsavedPermission[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  // Save all permission changes
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      if (unsavedChanges.length === 0) {
        console.log("[usePermissions] No changes to save - returning early");
        return;
      }
      
      console.log("[usePermissions] Starting to save permissions to database:", unsavedChanges);

      const permissionsToSave = unsavedChanges.map(change => ({
        role_id: change.roleId,
        frontend_registry_id: change.frontendRegistryId,
        can_view: change.canView,
        can_edit: change.canEdit
      }));

      console.log("[usePermissions] Formatted permissions for database save:", permissionsToSave);

      try {
        const { data, error } = await supabase
          .from("permissions")
          .upsert(permissionsToSave, { 
            onConflict: 'role_id,frontend_registry_id',
            ignoreDuplicates: false 
          });
          
        if (error) {
          console.error("[usePermissions] Supabase error saving permissions:", error);
          throw error;
        }
        
        console.log("[usePermissions] Permissions saved successfully. Response:", data);
        return data;
      } catch (error) {
        console.error("[usePermissions] Exception during permission save:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("[usePermissions] Save mutation succeeded, invalidating queries and resetting state");
      queryClient.invalidateQueries({ queryKey: ["role_permissions", selectedRoleId] });
      toast({
        title: "Permissions saved",
        description: `All permission changes have been saved successfully.`
      });
      setUnsavedChanges([]);
      setHasUnsavedChanges(false);
    },
    onError: (error: Error) => {
      console.error("[usePermissions] Error in savePermissionsMutation:", error);
      toast({
        title: "Error saving permissions",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleToggleTable = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  // Handle permission change for frontend registry
  const handlePermissionChange = (
    roleId: string,
    registryId: string,
    type: 'view' | 'edit',
    checked: boolean
  ) => {
    const role = roles?.find(r => r.id === roleId);
    
    if (role?.is_system === true) {
      toast({
        title: "Cannot modify system role",
        description: "System roles have predefined permissions that cannot be changed.",
        variant: "destructive",
      });
      return;
    }

    const existingPermission = permissions?.find(
      p => p.role_id === roleId && p.frontend_registry_id === registryId
    );

    const existingChange = unsavedChanges.find(
      c => c.roleId === roleId && c.frontendRegistryId === registryId
    );

    let newCanView = existingChange?.canView ?? existingPermission?.can_view ?? false;
    let newCanEdit = existingChange?.canEdit ?? existingPermission?.can_edit ?? false; 

    if (type === 'view') {
      newCanView = checked;
      if (!checked) {
        newCanEdit = false;
      }
    } else if (type === 'edit') {
      newCanEdit = checked;
      if (checked) {
        newCanView = true;
      }
    }

    const filteredChanges = unsavedChanges.filter(
      change => !(change.roleId === roleId && change.frontendRegistryId === registryId)
    );
    
    setUnsavedChanges([
      ...filteredChanges,
      {
        roleId,
        frontendRegistryId: registryId,
        canView: newCanView,
        canEdit: newCanEdit
      }
    ]);
    
    setHasUnsavedChanges(true);
    console.log(`Permission change made for registry ${registryId}, ${type}=${checked} -> canView=${newCanView}, canEdit=${newCanEdit}`);
  };

  // Get effective permission for registry items
  const getEffectivePermission = (
    roleId: string,
    registryId: string,
    type: 'view' | 'edit'
  ): boolean => {
    const role = roles?.find(r => r.id === roleId);
    if (role?.is_system === true) return true;

    const unsavedChange = unsavedChanges.find(
      change => change.roleId === roleId && change.frontendRegistryId === registryId
    );

    if (unsavedChange) {
      return type === 'view' ? unsavedChange.canView : unsavedChange.canEdit;
    }

    const savedPermission = permissions?.find(
      p => p.role_id === roleId && p.frontend_registry_id === registryId
    );

    if (savedPermission) {
      return type === 'view' ? savedPermission.can_view : savedPermission.can_edit;
    }

    return false;
  };

  // Update unsaved changes tracking
  useEffect(() => {
    console.log("[usePermissions] Unsaved changes updated:", unsavedChanges);
    
    if (unsavedChanges.length > 0 && !hasUnsavedChanges) {
      console.warn("[usePermissions] WARNING: We have unsaved changes, but hasUnsavedChanges flag is false!");
      setHasUnsavedChanges(true);
    }
    
    if (unsavedChanges.length === 0 && hasUnsavedChanges) {
      console.warn("[usePermissions] WARNING: We have no unsaved changes, but hasUnsavedChanges flag is true!");
    }
  }, [unsavedChanges, hasUnsavedChanges]);

  useEffect(() => {
    if (permissions) {
      console.log(`[usePermissions] Permissions fetched from database for role ${selectedRoleId}:`, permissions);
    }
  }, [permissions, selectedRoleId]);

  return {
    unsavedChanges,
    hasUnsavedChanges,
    expandedTables,
    savePermissionsMutation,
    handleToggleTable,
    handlePermissionChange,
    getEffectivePermission
  };
};
