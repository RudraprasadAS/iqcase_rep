import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase, permissionsApi } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Role } from "@/types/roles";
import { Permission, UnsavedPermission, TableInfo } from "@/types/permissions";
import { useRoleAccess } from "./useRoleAccess";

// New hook for checking field-level permissions
export const useFieldPermissions = () => {
  const { userRoles, hasActiveRole } = useRoleAccess();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["user-permissions", userRoles?.[0]?.role],
    queryFn: async () => {
      if (!userRoles?.length || !hasActiveRole()) return [];
      
      const roleId = userRoles[0].role; // Get role name, not ID
      
      // Get the role ID from the role name
      const { data: role } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleId)
        .single();
        
      if (!role) return [];
      
      const { data: perms } = await supabase
        .from('permissions')
        .select('*')
        .eq('role_id', role.id);
        
      return perms || [];
    },
    enabled: !!userRoles?.length && hasActiveRole()
  });

  const canViewField = (moduleName: string, fieldName?: string): boolean => {
    if (!permissions?.length) return false;
    
    // Check specific field permission first
    if (fieldName) {
      const fieldPerm = permissions.find(p => 
        p.module_name === moduleName && p.field_name === fieldName
      );
      if (fieldPerm) return fieldPerm.can_view;
    }
    
    // Check module-level permission
    const modulePerm = permissions.find(p => 
      p.module_name === moduleName && p.field_name === null
    );
    return modulePerm?.can_view || false;
  };

  const canEditField = (moduleName: string, fieldName?: string): boolean => {
    if (!permissions?.length) return false;
    
    // Check specific field permission first
    if (fieldName) {
      const fieldPerm = permissions.find(p => 
        p.module_name === moduleName && p.field_name === fieldName
      );
      if (fieldPerm) return fieldPerm.can_edit;
    }
    
    // Check module-level permission
    const modulePerm = permissions.find(p => 
      p.module_name === moduleName && p.field_name === null
    );
    return modulePerm?.can_edit || false;
  };

  return {
    permissions,
    isLoading,
    canViewField,
    canEditField
  };
};

export const usePermissions = (selectedRoleId: string, permissions?: Permission[], roles?: Role[], tables?: TableInfo[]) => {
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
      console.log("[usePermissions] Total number of changes:", unsavedChanges.length);

      // First, clean up any duplicate permissions for this role
      await permissionsApi.cleanupDuplicatePermissions(selectedRoleId);

      const permissionsToSave = unsavedChanges.map(change => ({
        role_id: change.roleId,
        module_name: change.moduleName,
        field_name: change.fieldName,
        can_view: change.canView,
        can_edit: change.canEdit
      }));

      console.log("[usePermissions] Formatted permissions for database save:", permissionsToSave);

      try {
        // Use upsert with merge strategy
        const { data, error } = await supabase
          .from("permissions")
          .upsert(permissionsToSave, { 
            onConflict: 'role_id,module_name,field_name',
            ignoreDuplicates: false 
          });
          
        if (error) {
          console.error("[usePermissions] Supabase error saving permissions:", error);
          throw error;
        }
        
        console.log("[usePermissions] Permissions saved successfully. Response:", data);
        
        // Run cleanup again after save to ensure we don't have duplicates
        await permissionsApi.cleanupDuplicatePermissions(selectedRoleId);
        
        return data;
      } catch (error) {
        console.error("[usePermissions] Exception during permission save:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("[usePermissions] Save mutation succeeded, invalidating queries and resetting state");
      queryClient.invalidateQueries({ queryKey: ["permissions", selectedRoleId] });
      queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
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

  const handlePermissionChange = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
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
      p => p.role_id === roleId && 
           p.module_name === moduleName && 
           p.field_name === fieldName
    );

    const existingChange = unsavedChanges.find(
      c => c.roleId === roleId && 
           c.moduleName === moduleName && 
           c.fieldName === fieldName
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
      change => !(change.roleId === roleId && 
                 change.moduleName === moduleName && 
                 change.fieldName === fieldName)
    );
    
    setUnsavedChanges([
      ...filteredChanges,
      {
        roleId,
        moduleName,
        fieldName,
        canView: newCanView,
        canEdit: newCanEdit
      }
    ]);
    
    setHasUnsavedChanges(true);
  };

  const handleSelectAllForTable = (
    roleId: string,
    tableName: string,
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

    const batchChanges: UnsavedPermission[] = [];
    
    let tablePermission = unsavedChanges.find(
      p => p.roleId === roleId && p.moduleName === tableName && p.fieldName === null
    );
    
    if (!tablePermission) {
      const existingTablePerm = permissions?.find(
        p => p.role_id === roleId && p.module_name === tableName && p.field_name === null
      );
      
      tablePermission = {
        roleId,
        moduleName: tableName,
        fieldName: null,
        canView: existingTablePerm?.can_view ?? false,
        canEdit: existingTablePerm?.can_edit ?? false
      };
    }
    
    if (type === 'view') {
      tablePermission.canView = checked;
      if (!checked) {
        tablePermission.canEdit = false;
      }
    } else if (type === 'edit') {
      tablePermission.canEdit = checked;
      if (checked) {
        tablePermission.canView = true;
      }
    }
    
    batchChanges.push({ ...tablePermission });
    
    const tableInfo = tables?.find(t => t.name === tableName);
    
    if (tableInfo && tableInfo.fields) {
      tableInfo.fields.forEach(field => {
        let fieldPermission = unsavedChanges.find(
          p => p.roleId === roleId && p.moduleName === tableName && p.fieldName === field
        );
        
        if (!fieldPermission) {
          const existingFieldPerm = permissions?.find(
            p => p.role_id === roleId && p.module_name === tableName && p.field_name === field
          );
          
          fieldPermission = {
            roleId,
            moduleName: tableName,
            fieldName: field,
            canView: existingFieldPerm?.can_view ?? false,
            canEdit: existingFieldPerm?.can_edit ?? false
          };
        }
        
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
    
    const remainingChanges = unsavedChanges.filter(
      change => !(change.roleId === roleId && 
                 change.moduleName === tableName)
    );
    
    setUnsavedChanges([...remainingChanges, ...batchChanges]);
    setHasUnsavedChanges(true);
    
    if (!expandedTables[tableName]) {
      setExpandedTables(prev => ({
        ...prev,
        [tableName]: true
      }));
    }
  };
  
  const handleBulkToggleForTable = handleSelectAllForTable;

  const getEffectivePermission = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit'
  ): boolean => {
    const role = roles?.find(r => r.id === roleId);
    if (role?.is_system === true) return true;

    const unsavedChange = unsavedChanges.find(
      change => change.roleId === roleId && 
                change.moduleName === moduleName && 
                change.fieldName === fieldName
    );

    if (unsavedChange) {
      if (type === 'view') return unsavedChange.canView;
      return unsavedChange.canEdit;
    }

    if (fieldName !== null) {
      const unsavedTableChange = unsavedChanges.find(
        change => change.roleId === roleId && 
                  change.moduleName === moduleName && 
                  change.fieldName === null
      );

      if (unsavedTableChange) {
        if (type === 'view' && unsavedTableChange.canView) return true;
        if (type === 'edit' && unsavedTableChange.canEdit) return true;
      }

      const tablePermission = permissions?.find(
        p => p.role_id === roleId && 
             p.module_name === moduleName && 
             p.field_name === null
      );

      if (tablePermission) {
        if (type === 'view' && tablePermission.can_view) return true;
        if (type === 'edit' && tablePermission.can_edit) return true;
      }
    }

    const savedPermission = permissions?.find(
      p => p.role_id === roleId && 
           p.module_name === moduleName && 
           p.field_name === fieldName
    );

    if (savedPermission) {
      if (type === 'view') return savedPermission.can_view;
      return savedPermission.can_edit;
    }

    return false;
  };

  return {
    unsavedChanges,
    hasUnsavedChanges,
    expandedTables,
    savePermissionsMutation,
    handleToggleTable,
    handlePermissionChange,
    handleBulkToggleForTable,
    handleSelectAllForTable,
    getEffectivePermission
  };
};
