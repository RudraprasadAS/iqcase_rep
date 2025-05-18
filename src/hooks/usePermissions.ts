import { useState, useEffect } from "react";
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
      if (unsavedChanges.length === 0) {
        console.log("No changes to save - returning early");
        return;
      }
      
      console.log("Starting to save permissions to database:", unsavedChanges);
      console.log("Total number of changes:", unsavedChanges.length);

      const permissionsToSave = unsavedChanges.map(change => ({
        role_id: change.roleId,
        module_name: change.moduleName,
        field_name: change.fieldName,
        can_view: change.canView,
        can_edit: change.canEdit
      }));

      console.log("Formatted permissions for database save:", permissionsToSave);

      try {
        const { data, error } = await supabase
          .from("permissions")
          .upsert(permissionsToSave, { 
            onConflict: 'role_id,module_name,field_name', 
            ignoreDuplicates: false 
          });
          
        if (error) {
          console.error("Supabase error saving permissions:", error);
          throw error;
        }
        
        console.log("Permissions saved successfully. Response:", data);
        return data;
      } catch (error) {
        console.error("Exception during permission save:", error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log("Save mutation succeeded, invalidating queries and resetting state");
      queryClient.invalidateQueries({ queryKey: ["permissions", selectedRoleId] });
      toast({
        title: "Permissions saved",
        description: `All permission changes have been saved successfully.`
      });
      setUnsavedChanges([]);
      setHasUnsavedChanges(false);
    },
    onError: (error: Error) => {
      console.error("Error in savePermissionsMutation:", error);
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
    type: 'view' | 'edit',
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

    // Find unsaved changes for this permission
    const existingChange = unsavedChanges.find(
      c => c.roleId === roleId && 
           c.moduleName === moduleName && 
           c.fieldName === fieldName
    );

    // Start with either unsaved changes or existing permissions
    let newCanView = existingChange?.canView ?? existingPermission?.can_view ?? false;
    let newCanEdit = existingChange?.canEdit ?? existingPermission?.can_edit ?? false; 

    // Apply updated permission logic based on behavior rules
    if (type === 'view') {
      newCanView = checked;
      // If unchecking view, also uncheck edit
      if (!checked) {
        newCanEdit = false;
      }
    } else if (type === 'edit') {
      newCanEdit = checked;
      
      // If checking edit, auto-enable view
      if (checked) {
        newCanView = true;
      }
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
        canEdit: newCanEdit
      }
    ]);
    
    setHasUnsavedChanges(true);
    
    console.log(`Permission change made for ${moduleName}.${fieldName}, ${type}=${checked} -> canView=${newCanView}, canEdit=${newCanEdit}`);
  };

  // Completely rewritten to properly update all fields under a table
  const handleSelectAllForTable = (
    roleId: string,
    tableName: string,
    type: 'view' | 'edit',
    checked: boolean
  ) => {
    console.log(`Bulk table permission: ${tableName}, ${type}=${checked}`);
    
    // Find the role
    const role = roles?.find(r => r.id === roleId);
    
    if (role?.is_system === true) {
      toast({
        title: "Cannot modify system role",
        description: "System roles have predefined permissions that cannot be changed.",
        variant: "destructive",
      });
      return;
    }

    // Create a batch of changes for all the fields
    const batchChanges: UnsavedPermission[] = [];
    
    // First, handle the table-level permission itself
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
    
    // Apply the permission change with cascading logic
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
    
    // Now, do the same for all fields under this table
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
        
        // Apply the same permission changes with cascading logic
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
      change => !(change.roleId === roleId && 
                 change.moduleName === tableName)
    );
    
    // Merge the batch changes with remaining changes
    setUnsavedChanges([...remainingChanges, ...batchChanges]);
    setHasUnsavedChanges(true);
    
    // Ensure the table is expanded to show changes
    if (!expandedTables[tableName]) {
      setExpandedTables(prev => ({
        ...prev,
        [tableName]: true
      }));
    }
  };
  
  // Delegate to the main function
  const handleBulkToggleForTable = handleSelectAllForTable;

  // Modified to correctly check both existing and unsaved changes
  const getEffectivePermission = (
    roleId: string,
    moduleName: string,
    fieldName: string | null,
    type: 'view' | 'edit'
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
      return unsavedChange.canEdit;
    }

    // For field-level permissions, check if any table-level permissions have been changed
    if (fieldName !== null) {
      // Check for unsaved table-level changes first
      const unsavedTableChange = unsavedChanges.find(
        change => change.roleId === roleId && 
                  change.moduleName === moduleName && 
                  change.fieldName === null
      );

      if (unsavedTableChange) {
        if (type === 'view' && unsavedTableChange.canView) return true;
        if (type === 'edit' && unsavedTableChange.canEdit) return true;
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
      }
    }

    // If no unsaved changes, check for a saved permission at this specific level
    const savedPermission = permissions?.find(
      p => p.role_id === roleId && 
           p.module_name === moduleName && 
           p.field_name === fieldName
    );

    if (savedPermission) {
      if (type === 'view') return savedPermission.can_view;
      return savedPermission.can_edit;
    }

    // Default to false if no permission is found
    return false;
  };

  // Extra debug function to help diagnose permission issues
  const logPermissionState = () => {
    console.log("Current permissions:", permissions);
    console.log("Unsaved changes:", unsavedChanges);
  };
  
  // Add a debug log whenever unsavedChanges updates
  useEffect(() => {
    console.log("Unsaved changes updated:", unsavedChanges);
    
    // If we have pending changes but hasUnsavedChanges is false, log a warning
    if (unsavedChanges.length > 0 && !hasUnsavedChanges) {
      console.warn("WARNING: We have unsaved changes, but hasUnsavedChanges flag is false!");
    }
    
    // If we have no pending changes but hasUnsavedChanges is true, log a warning
    if (unsavedChanges.length === 0 && hasUnsavedChanges) {
      console.warn("WARNING: We have no unsaved changes, but hasUnsavedChanges flag is true!");
    }
  }, [unsavedChanges, hasUnsavedChanges]);

  // Add a debug log when permissions are fetched from database
  useEffect(() => {
    if (permissions) {
      console.log(`Permissions fetched from database for role ${selectedRoleId}:`, permissions);
    }
  }, [permissions, selectedRoleId]);

  // Add this new debug function to examine current data state
  const debugCurrentState = () => {
    console.log("=== CURRENT PERMISSION STATE ===");
    console.log("Selected Role ID:", selectedRoleId);
    console.log("Database Permissions:", permissions);
    console.log("Unsaved Changes:", unsavedChanges);
    console.log("Has Unsaved Changes Flag:", hasUnsavedChanges);
    console.log("Expanded Tables:", expandedTables);
    console.log("================================");
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
    getEffectivePermission,
    debugCurrentState
  };
};
