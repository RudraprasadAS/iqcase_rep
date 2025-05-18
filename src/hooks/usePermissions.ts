
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Role } from "@/types/roles";
import { Permission, UnsavedPermission, TableInfo } from "@/types/permissions";

export const usePermissions = (selectedRoleId: string, permissions?: Permission[], roles?: Role[], tables?: TableInfo[]) => {
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

    // Find and remove any existing unsaved change for this permission
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
    
    // Find the table in the tables array
    const tableInfo = tables?.find(t => t.name === tableName);
    
    // Apply the same permission to all fields within the table
    if (tableInfo && tableInfo.fields) {
      tableInfo.fields.forEach(field => {
        handlePermissionChange(roleId, tableName, field, type, checked);
      });
    }
    
    // Auto-expand the table to show the affected fields
    if (checked && !expandedTables[tableName]) {
      setExpandedTables(prev => ({
        ...prev,
        [tableName]: true
      }));
    }
  };

  // Updated to apply changes to all fields within a table
  const handleSelectAllForTable = (
    roleId: string,
    tableName: string,
    type: 'view' | 'edit' | 'delete',
    checked: boolean
  ) => {
    // Find the table in the tables array
    const tableInfo = tables?.find(t => t.name === tableName);
    
    // Apply to table-level permission first
    handlePermissionChange(roleId, tableName, null, type, checked);
    
    // Apply the same permission to all fields within the table
    if (tableInfo && tableInfo.fields) {
      tableInfo.fields.forEach(field => {
        handlePermissionChange(roleId, tableName, field, type, checked);
      });
    }
    
    // Auto-expand the table to show the affected fields
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: true
    }));
  };

  // Modified function to correctly check for table-level permissions that should apply to fields
  const getEffectivePermission = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit' | 'delete'
  ): boolean => {
    // For system roles specifically marked with is_system=true, return true for all permissions
    const role = roles?.find(r => r.id === roleId);
    if (role?.is_system === true) return true;

    // Check for unsaved changes first at this specific level
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

    // For field-level permissions, check if any table-level permissions have been changed
    if (fieldName !== null) {
      // Check for unsaved table-level changes
      const unsavedTableChange = unsavedChanges.find(
        change => change.roleId === roleId && 
                  change.moduleName === moduleName && 
                  change.fieldName === null
      );

      if (unsavedTableChange) {
        if (type === 'view' && unsavedTableChange.canView) return true;
        if (type === 'edit' && unsavedTableChange.canEdit) return true;
        if (type === 'delete' && unsavedTableChange.canDelete) return true;
      }

      // Check for saved table-level permissions
      const tablePermission = permissions?.find(
        p => p.role_id === roleId && 
             p.module_name === moduleName && 
             p.field_name === null
      );

      if (tablePermission) {
        if (type === 'view' && tablePermission.can_view) return true;
        if (type === 'edit' && tablePermission.can_edit) return true;
        if (type === 'delete' && tablePermission.can_delete) return true;
      }
    }

    // Finally, check for a saved permission at this specific level
    const savedPermission = permissions?.find(
      p => p.role_id === roleId && 
           p.module_name === moduleName && 
           p.field_name === fieldName
    );

    if (savedPermission) {
      if (type === 'view') return savedPermission.can_view;
      if (type === 'edit') return savedPermission.can_edit;
      return savedPermission.can_delete;
    }

    // Default to false if no permission is found
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
