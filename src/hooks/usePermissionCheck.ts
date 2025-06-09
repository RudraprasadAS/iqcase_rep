
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PermissionCheckResult {
  hasPermission: boolean;
  isLoading: boolean;
  error: Error | null;
}

// Hook to check if current user has permission for a specific frontend element
export const usePermissionCheck = (
  elementKey: string,
  permissionType: 'view' | 'edit' = 'view'
): PermissionCheckResult => {
  const { data: hasPermission = false, isLoading, error } = useQuery({
    queryKey: ['frontend_permission', elementKey, permissionType],
    queryFn: async () => {
      console.log(`🔍 [Permission Check] Checking permission for: ${elementKey}, type: ${permissionType}`);
      
      const { data, error } = await supabase.rpc('current_user_has_frontend_permission', {
        p_element_key: elementKey,
        p_permission_type: permissionType
      });
      
      if (error) {
        console.error('❌ [Permission Check] Error:', error);
        throw error;
      }
      
      console.log(`✅ [Permission Check] Result for ${elementKey}.${permissionType}:`, data);
      return data as boolean;
    },
    enabled: !!elementKey,
  });

  console.log(`🎯 [Permission Check] Final result for ${elementKey}.${permissionType}:`, {
    hasPermission,
    isLoading,
    error: error?.message
  });

  return {
    hasPermission,
    isLoading,
    error: error as Error | null
  };
};

// Hook to check multiple permissions at once
export const useBulkPermissionCheck = (permissions: Array<{
  elementKey: string;
  permissionType?: 'view' | 'edit';
}>) => {
  const { data: permissionResults = {}, isLoading, error } = useQuery({
    queryKey: ['bulk_frontend_permissions', permissions],
    queryFn: async () => {
      const results: Record<string, boolean> = {};
      
      for (const perm of permissions) {
        const key = `${perm.elementKey}.${perm.permissionType || 'view'}`;
        
        const { data, error } = await supabase.rpc('current_user_has_frontend_permission', {
          p_element_key: perm.elementKey,
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
