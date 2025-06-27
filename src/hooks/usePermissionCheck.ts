
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePermissionCheck = (elementKey: string, permissionType: 'view' | 'edit' = 'view') => {
  const { data: hasPermission, isLoading, error } = useQuery({
    queryKey: ['permission-check', elementKey, permissionType],
    queryFn: async () => {
      console.log(`🔒 [usePermissionCheck] Checking permission for ${elementKey} (${permissionType})`);
      
      try {
        // Use the backend function to check permissions
        const { data, error } = await supabase
          .rpc('current_user_has_frontend_permission', {
            p_element_key: elementKey,
            p_permission_type: permissionType
          });

        if (error) {
          console.error(`🔒 [usePermissionCheck] RPC error for ${elementKey}:`, error);
          throw error;
        }

        console.log(`🔒 [usePermissionCheck] Backend permission result for ${elementKey} (${permissionType}):`, data);
        return data as boolean;
      } catch (err) {
        console.error(`🔒 [usePermissionCheck] Exception checking permission for ${elementKey}:`, err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (updated from cacheTime)
  });

  return {
    hasPermission: hasPermission ?? false,
    isLoading,
    error
  };
};

// Bulk permission check for multiple elements
export const useBulkPermissionCheck = (permissions: Array<{ elementKey: string; permissionType: 'view' | 'edit' }>) => {
  const { data: permissionResults, isLoading, error } = useQuery({
    queryKey: ['bulk-permission-check', permissions],
    queryFn: async () => {
      console.log(`🔒 [useBulkPermissionCheck] Checking permissions for ${permissions.length} elements`);
      
      const results: Record<string, boolean> = {};
      
      try {
        // Check each permission
        for (const perm of permissions) {
          const { data, error } = await supabase
            .rpc('current_user_has_frontend_permission', {
              p_element_key: perm.elementKey,
              p_permission_type: perm.permissionType
            });

          if (error) {
            console.error(`🔒 [useBulkPermissionCheck] RPC error for ${perm.elementKey}:`, error);
            results[`${perm.elementKey}.${perm.permissionType}`] = false;
          } else {
            results[`${perm.elementKey}.${perm.permissionType}`] = data as boolean;
          }
        }

        console.log(`🔒 [useBulkPermissionCheck] Bulk permission results:`, results);
        return results;
      } catch (err) {
        console.error(`🔒 [useBulkPermissionCheck] Exception during bulk check:`, err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    permissionResults: permissionResults ?? {},
    isLoading,
    error
  };
};

// Legacy compatibility - useAccessCheck for existing components
export const useAccessCheck = () => {
  const { data: userInfo, isLoading } = useQuery({
    queryKey: ['current-user-info'],
    queryFn: async () => {
      console.log('🔒 [useAccessCheck] Fetching current user info');
      
      try {
        const { data, error } = await supabase
          .rpc('get_current_user_info');

        if (error) {
          console.error('🔒 [useAccessCheck] Error fetching user info:', error);
          throw error;
        }

        console.log('🔒 [useAccessCheck] User info:', data);
        return data?.[0] || null;
      } catch (err) {
        console.error('🔒 [useAccessCheck] Exception fetching user info:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const hasAccess = ({ module, screen, element_key, type }: {
    module: string;
    screen?: string;
    element_key?: string;
    type: 'can_view' | 'can_edit';
  }) => {
    // Build element key based on provided parameters
    let elementKey = module;
    if (screen) elementKey += `.${screen}`;
    if (element_key) elementKey += `.${element_key}`;
    
    // For now, return a simple check - in a real implementation,
    // this would need to be replaced with proper permission checking
    return userInfo?.is_admin || userInfo?.is_super_admin || false;
  };

  return {
    hasAccess,
    isLoading,
    userInfo
  };
};
