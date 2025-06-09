
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { moduleRegistry } from "@/config/moduleRegistry";

interface ModulePermissionResult {
  hasViewPermission: boolean;
  hasEditPermission: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Hook to check permissions for a specific module/screen/field
export const useModulePermission = (
  moduleName: string,
  screenName?: string,
  fieldName?: string
): ModulePermissionResult => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['module_permission', moduleName, screenName, fieldName],
    queryFn: async () => {
      // Check view permission
      const { data: viewData, error: viewError } = await supabase.rpc('current_user_can_access', {
        p_module_name: moduleName,
        p_field_name: fieldName ? `${screenName}.${fieldName}` : screenName,
        p_permission_type: 'view'
      });
      
      if (viewError) {
        console.error('View permission check error:', viewError);
        throw viewError;
      }
      
      // Check edit permission
      const { data: editData, error: editError } = await supabase.rpc('current_user_can_access', {
        p_module_name: moduleName,
        p_field_name: fieldName ? `${screenName}.${fieldName}` : screenName,
        p_permission_type: 'edit'
      });
      
      if (editError) {
        console.error('Edit permission check error:', editError);
        throw editError;
      }
      
      return {
        hasViewPermission: viewData as boolean,
        hasEditPermission: editData as boolean
      };
    },
    enabled: !!moduleName,
  });

  return {
    hasViewPermission: data?.hasViewPermission ?? false,
    hasEditPermission: data?.hasEditPermission ?? false,
    isLoading,
    error: error as Error | null
  };
};

// Hook to get all modules the current user has access to
export const useAccessibleModules = () => {
  const { data: accessibleModules = [], isLoading, error } = useQuery({
    queryKey: ['accessible_modules'],
    queryFn: async () => {
      const accessible = [];
      
      for (const module of moduleRegistry.modules) {
        // Check if user has view permission for this module
        const { data, error } = await supabase.rpc('current_user_can_access', {
          p_module_name: module.name,
          p_field_name: null,
          p_permission_type: 'view'
        });
        
        if (!error && data) {
          accessible.push(module);
        }
      }
      
      return accessible;
    },
  });

  return {
    accessibleModules,
    isLoading,
    error: error as Error | null
  };
};

// Hook to check if user can perform a specific action
export const useModuleAction = (moduleName: string, actionName: string) => {
  const { data: canPerformAction = false, isLoading, error } = useQuery({
    queryKey: ['module_action', moduleName, actionName],
    queryFn: async () => {
      const permissionType = actionName === 'view' ? 'view' : 'edit';
      
      const { data, error } = await supabase.rpc('current_user_can_access', {
        p_module_name: moduleName,
        p_field_name: `action.${actionName}`,
        p_permission_type: permissionType
      });
      
      if (error) {
        console.error('Action permission check error:', error);
        return false;
      }
      
      return data as boolean;
    },
    enabled: !!moduleName && !!actionName,
  });

  return {
    canPerformAction,
    isLoading,
    error: error as Error | null
  };
};
