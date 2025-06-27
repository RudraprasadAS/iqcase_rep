
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Role } from "@/types/roles";

interface UnsavedPermission {
  roleId: string;
  frontendRegistryId: string;
  canView: boolean;
  canEdit: boolean;
}

export const usePermissions = (selectedRoleId: string, permissions?: any[], roles?: Role[], frontendElements?: any[]) => {
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
        // Use upsert with merge strategy
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
      queryClient.invalidateQueries({ queryKey: ["permissions", selectedRoleId] });
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
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

  // Find frontend registry entry by element key
  const findRegistryEntry = (elementKey: string, fieldName?: string | null) => {
    if (!frontendElements) {
      console.warn(`🔍 [usePermissions] No frontend elements available`);
      return null;
    }
    
    const fullKey = fieldName ? `${elementKey}.${fieldName}` : elementKey;
    
    const entry = frontendElements.find(entry => entry.element_key === fullKey);
    
    console.log(`🔍 [usePermissions] Looking for registry entry: "${fullKey}"`);
    console.log(`🔍 [usePermissions] Found entry:`, entry);
    
    return entry;
  };

  // Updated handle permission change for frontend elements
  const handlePermissionChange = (
    roleId: string,
    elementKey: string,
    fieldName: string | null,
    type: 'view' | 'edit',
    checked: boolean
  ) => {
    // Find the role to check if it's a system role
    const role = roles?.find(r => r.id === roleId);
    
    // Check if this is a system role and prevent modification
    if (role?.is_system === true) {
      toast({
        title: "Cannot modify system role",
        description: "System roles have predefined permissions that cannot be changed.",
        variant: "destructive",
      });
      return;
    }

    // Find the frontend registry entry
    const registryEntry = findRegistryEntry(elementKey, fieldName);
    if (!registryEntry) {
      console.error(`[usePermissions] Frontend registry entry not found for: ${elementKey}${fieldName ? '.' + fieldName : ''}`);
      toast({
        title: "Error",
        description: `Could not find registry entry for ${elementKey}${fieldName ? '.' + fieldName : ''}`,
        variant: "destructive"
      });
      return;
    }

    console.log(`🔍 [usePermissions] Permission change for ${elementKey}${fieldName ? '.' + fieldName : ''} (${type}): ${checked}`);

    // Get current permissions for this registry entry
    const existingPermission = permissions?.find(
      p => p.role_id === roleId && p.frontend_registry_id === registryEntry.id
    );

    // Find unsaved changes for this permission
    const existingChange = unsavedChanges.find(
      c => c.roleId === roleId && c.frontendRegistryId === registryEntry.id
    );

    // Start with either unsaved changes or existing permissions
    let newCanView = existingChange?.canView ?? existingPermission?.can_view ?? false;
    let newCanEdit = existingChange?.canEdit ?? existingPermission?.can_edit ?? false; 

    // Apply updated permission logic based on behavior rules
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

    console.log(`🔍 [usePermissions] New permission state: canView=${newCanView}, canEdit=${newCanEdit}`);

    // Find and remove any existing unsaved change for this permission
    const filteredChanges = unsavedChanges.filter(
      change => !(change.roleId === roleId && change.frontendRegistryId === registryEntry.id)
    );
    
    // Add the new change
    setUnsavedChanges([
      ...filteredChanges,
      {
        roleId,
        frontendRegistryId: registryEntry.id,
        canView: newCanView,
        canEdit: newCanEdit
      }
    ]);
    
    setHasUnsavedChanges(true);
  };

  // Handle select all for frontend elements
  const handleSelectAllForTable = (
    roleId: string,
    elementKey: string,
    type: 'view' | 'edit',
    checked: boolean
  ) => {
    console.log(`Bulk element permission: ${elementKey}, ${type}=${checked}`);
    
    const role = roles?.find(r => r.id === roleId);
    
    // Check if this is a system role and prevent modification
    if (role?.is_system === true) {
      toast({
        title: "Cannot modify system role",
        description: "System roles have predefined permissions that cannot be changed.",
        variant: "destructive",
      });
      return;
    }

    const batchChanges: UnsavedPermission[] = [];
    
    // Handle the page-level permission
    const pageRegistryEntry = findRegistryEntry(elementKey);
    if (pageRegistryEntry) {
      let pagePermission = unsavedChanges.find(
        p => p.roleId === roleId && p.frontendRegistryId === pageRegistryEntry.id
      );
      
      if (!pagePermission) {
        const existingPagePerm = permissions?.find(
          p => p.role_id === roleId && p.frontend_registry_id === pageRegistryEntry.id
        );
        
        pagePermission = {
          roleId,
          frontendRegistryId: pageRegistryEntry.id,
          canView: existingPagePerm?.can_view ?? false,
          canEdit: existingPagePerm?.can_edit ?? false
        };
      }
      
      // Apply the permission change with cascading logic
      if (type === 'view') {
        pagePermission.canView = checked;
        if (!checked) {
          pagePermission.canEdit = false;
        }
      } else if (type === 'edit') {
        pagePermission.canEdit = checked;
        if (checked) {
          pagePermission.canView = true;
        }
      }
      
      batchChanges.push({ ...pagePermission });
    }
    
    // Handle field-level permissions
    if (frontendElements) {
      const fieldEntries = frontendElements.filter(entry => 
        entry.element_key.startsWith(`${elementKey}.`) && entry.element_type === 'field'
      );
      
      fieldEntries.forEach(fieldEntry => {
        let fieldPermission = unsavedChanges.find(
          p => p.roleId === roleId && p.frontendRegistryId === fieldEntry.id
        );
        
        if (!fieldPermission) {
          const existingFieldPerm = permissions?.find(
            p => p.role_id === roleId && p.frontend_registry_id === fieldEntry.id
          );
          
          fieldPermission = {
            roleId,
            frontendRegistryId: fieldEntry.id,
            canView: existingFieldPerm?.can_view ?? false,
            canEdit: existingFieldPerm?.can_edit ?? false
          };
        }
        
        // Apply cascading permissions to all child fields
        if (type === 'view') {
          fieldPermission.canView = checked;
          if (!checked) {
            fieldPermission.canEdit = false;
          }
        } else if (type === 'edit') {
          fieldPermission.canEdit = checked;
          if (checked) {
            fieldPermission.canView = true;
          }
        }
        
        batchChanges.push({ ...fieldPermission });
      });
    }
    
    console.log("Bulk changes created:", batchChanges);
    
    // Filter out any existing changes for these items
    const remainingChanges = unsavedChanges.filter(
      change => !batchChanges.some(bc => 
        bc.roleId === change.roleId && bc.frontendRegistryId === change.frontendRegistryId
      )
    );
    
    // Merge the batch changes with remaining changes
    setUnsavedChanges([...remainingChanges, ...batchChanges]);
    setHasUnsavedChanges(true);
    
    // Ensure the table is expanded to show changes
    const tableName = frontendElements?.find(e => e.element_key === elementKey)?.label || elementKey;
    if (!expandedTables[tableName]) {
      setExpandedTables(prev => ({
        ...prev,
        [tableName]: true
      }));
    }
  };

  // FIXED: Get effective permission for frontend elements - completely rewritten
  const getEffectivePermission = (
    roleId: string,
    elementKey: string,
    fieldName: string | null,
    type: 'view' | 'edit'
  ): boolean => {
    console.log(`🔍 [getEffectivePermission] Checking ${elementKey}${fieldName ? '.' + fieldName : ''} for role ${roleId} (${type})`);
    
    // For system roles, return true for all permissions
    const role = roles?.find(r => r.id === roleId);
    if (role?.is_system === true) {
      console.log(`🔍 [getEffectivePermission] System role ${role.name} - granting all permissions`);
      return true;
    }

    // Find the frontend registry entry
    const registryEntry = findRegistryEntry(elementKey, fieldName);
    if (!registryEntry) {
      console.warn(`🔍 [getEffectivePermission] No registry entry found for ${elementKey}${fieldName ? '.' + fieldName : ''} - denying access`);
      return false;
    }

    // Check for unsaved changes first
    const unsavedChange = unsavedChanges.find(
      change => change.roleId === roleId && change.frontendRegistryId === registryEntry.id
    );

    if (unsavedChange) {
      const result = type === 'view' ? unsavedChange.canView : unsavedChange.canEdit;
      console.log(`🔍 [getEffectivePermission] Found unsaved change: ${result}`);
      return result;
    }

    // Check for saved permissions in database
    const savedPermission = permissions?.find(
      p => p.role_id === roleId && p.frontend_registry_id === registryEntry.id
    );

    if (savedPermission) {
      const result = type === 'view' ? savedPermission.can_view : savedPermission.can_edit;
      console.log(`🔍 [getEffectivePermission] Found saved permission: ${result} (registry ID: ${registryEntry.id})`);
      return result;
    }

    // Default to false for non-system roles if no permission is found
    console.log(`🔍 [getEffectivePermission] No permission found - defaulting to FALSE for non-system role`);
    return false;
  };

  // Debug function to examine current data state
  const debugCurrentState = () => {
    console.log("=== CURRENT PERMISSION STATE ===");
    console.log("Selected Role ID:", selectedRoleId);
    console.log("Database Permissions:", permissions);
    console.log("Unsaved Changes:", unsavedChanges);
    console.log("Has Unsaved Changes Flag:", hasUnsavedChanges);
    console.log("Expanded Tables:", expandedTables);
    console.log("Frontend Elements:", frontendElements);
    console.log("================================");
  };

  // Add debug logging
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
    if (permissions && selectedRoleId) {
      console.log(`[usePermissions] Permissions fetched from database for role ${selectedRoleId}:`, permissions);
      
      // Debug specific permissions
      const role = roles?.find(r => r.id === selectedRoleId);
      console.log(`🔍 [usePermissions] Role details:`, role);
      
      if (permissions.length > 0) {
        console.log(`🔍 [usePermissions] Permission details:`, permissions.map(p => ({
          registry_id: p.frontend_registry_id,
          element_key: p.frontend_registry?.element_key,
          can_view: p.can_view,
          can_edit: p.can_edit
        })));
      } else {
        console.log(`🔍 [usePermissions] NO PERMISSIONS FOUND IN DATABASE for role ${selectedRoleId}`);
      }
    }
  }, [permissions, selectedRoleId, roles]);

  // Reset unsaved changes when role changes
  useEffect(() => {
    if (selectedRoleId) {
      setUnsavedChanges([]);
      setHasUnsavedChanges(false);
    }
  }, [selectedRoleId]);

  return {
    unsavedChanges,
    hasUnsavedChanges,
    expandedTables,
    savePermissionsMutation,
    handleToggleTable,
    handlePermissionChange,
    handleSelectAllForTable,
    getEffectivePermission,
    debugCurrentState
  };
};
