
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PermissionCheckResult {
  hasPermission: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Hook to check if current user has permission for a specific module/field
export const usePermissionCheck = (
  moduleName: string,
  fieldName?: string | null,
  permissionType: 'view' | 'edit' = 'view'
): PermissionCheckResult => {
  const { data: hasPermission = false, isLoading, error } = useQuery({
    queryKey: ['permission', moduleName, fieldName, permissionType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('current_user_can_access', {
        p_module_name: moduleName,
        p_field_name: fieldName,
        p_permission_type: permissionType
      });
      
      if (error) {
        console.error('Permission check error:', error);
        throw error;
      }
      
      return data as boolean;
    },
    enabled: !!moduleName,
  });

  return {
    hasPermission,
    isLoading,
    error: error as Error | null
  };
};

// Hook to check multiple permissions at once
export const useBulkPermissionCheck = (permissions: Array<{
  moduleName: string;
  fieldName?: string | null;
  permissionType?: 'view' | 'edit';
}>) => {
  const { data: permissionResults = {}, isLoading, error } = useQuery({
    queryKey: ['bulk_permissions', permissions],
    queryFn: async () => {
      const results: Record<string, boolean> = {};
      
      for (const perm of permissions) {
        const key = `${perm.moduleName}${perm.fieldName ? `.${perm.fieldName}` : ''}.${perm.permissionType || 'view'}`;
        
        const { data, error } = await supabase.rpc('current_user_can_access', {
          p_module_name: perm.moduleName,
          p_field_name: perm.fieldName,
          p_permission_type: perm.permissionType || 'view'
        });
        
        if (error) {
          console.error(`Permission check error for ${key}:`, error);
          results[key] = false;
        } else {
          results[key] = data as boolean;
        }
      }
      
      return results;
    },
    enabled: permissions.length > 0,
  });

  return {
    permissionResults,
    isLoading,
    error: error as Error | null
  };
};
