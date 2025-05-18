
import { useState } from "react";
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
      if (unsavedChanges.length === 0) return;

      const permissionsToSave = unsavedChanges.map(change => ({
        role_id: change.roleId,
        module_name: change.moduleName,
        field_name: change.fieldName,
        can_view: change.canView,
        can_edit: change.canEdit,
        can_delete: change.canDelete
      }));

      const { data, error } = await supabase
        .from("permissions")
        .upsert(permissionsToSave, { 
          onConflict: 'role_id,module_name,field_name', 
          ignoreDuplicates: false 
        });
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions", selectedRoleId] });
      toast({
        title: "Permissions saved",
        description: `All permission changes have been saved successfully.`
      });
      setUnsavedChanges([]);
      setHasUnsavedChanges(false);
    },
    onError: (error: Error) => {
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

  // Updated handle permission change to implement required behavior rules
  const handlePermissionChange = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => {
    // Find the role to check if it's a system role
    const role = roles?.find(r => r.id === roleId);
    
    // Only prevent modifications for system roles that are explicitly marked as is_system=true
    if (role?.is_system === true) {
      toast({
        title: "Cannot modify system role",
        description: "System roles have predefined permissions that cannot be changed.",
        variant: "destructive",
      });
      return;
    }

    // Get current permissions for this role and module
    const existingPermission = permissions?.find(
      p => p.role_id === roleId && 
           p.module_name === moduleName && 
           p.field_name === fieldName
    );

    // Apply updated permission logic based on behavior rules
    let newCanView = existingPermission?.can_view || false;
    let newCanEdit = existingPermission?.can_edit || false; 
    let newCanDelete = existingPermission?.can_delete || false;

    if (type === 'view') {
      newCanView = checked;
      // If unchecking view, also uncheck edit and delete
      if (!checked) {
        newCanEdit = false;
        newCanDelete = false;
      }
    } else if (type === 'edit') {
      newCanEdit = checked;
      
      // If checking edit, auto-enable view
      if (checked) {
        newCanView = true;
      } 
      // If unchecking edit, auto-uncheck delete
      else {
        newCanDelete = false;
      }
    } else if (type === 'delete') {
      newCanDelete = checked;
      
      // If checking delete, auto-enable both view and edit
      if (checked) {
        newCanView = true;
        newCanEdit = true;
      }
      // If unchecking delete, no impact on other permissions
    }

    // Add to unsaved changes
    const changeKey = `${roleId}-${moduleName}-${fieldName || 'null'}`; 
    
    // Remove previous change for the same permission if exists
    const filteredChanges = unsavedChanges.filter(
      change => !(change.roleId === roleId && 
                 change.moduleName === moduleName && 
                 change.fieldName === fieldName)
    );
    
    // Add the new change
    setUnsavedChanges([
      ...filteredChanges,
      {
        roleId,
        moduleName,
        fieldName,
        canView: newCanView,
        canEdit: newCanEdit,
        canDelete: newCanDelete
      }
    ]);
    
    setHasUnsavedChanges(true);
  };

  // Enhanced function to handle bulk toggle for all fields in a table
  const handleBulkToggleForTable = (
    roleId: string,
    tableName: string,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => {
    // Apply to table-level permission first
    handlePermissionChange(roleId, tableName, null, type, checked);
    
    // Auto-expand the table to show the affected fields
    if (checked && !expandedTables[tableName]) {
      setExpandedTables(prev => ({
        ...prev,
        [tableName]: true
      }));
    }
    
    // Force a refresh of the UI
    setTimeout(() => {
      setHasUnsavedChanges(true);
    }, 50);
  };

  const handleSelectAllForTable = (
    roleId: string,
    tableName: string,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => {
    // Apply to table-level permission
    handlePermissionChange(roleId, tableName, null, type, checked);
  };

  const getEffectivePermission = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit' | 'delete'
  ): boolean => {
    // Check if there's an unsaved change
    const unsavedChange = unsavedChanges.find(
      change => change.roleId === roleId && 
                change.moduleName === moduleName && 
                change.fieldName === fieldName
    );

    if (unsavedChange) {
      if (type === 'view') return unsavedChange.canView;
      if (type === 'edit') return unsavedChange.canEdit;
      return unsavedChange.canDelete;
    }

    // For system roles specifically marked with is_system=true, return true for all permissions
    const role = roles?.find(r => r.id === roleId);
    if (role?.is_system === true) return true;

    // Check if permission exists in the database
    const permission = permissions?.find(
      p => p.role_id === roleId && 
           p.module_name === moduleName && 
           p.field_name === fieldName
    );

    if (type === 'view') return !!permission?.can_view;
    if (type === 'edit') return !!permission?.can_edit;
    return !!permission?.can_delete;
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
