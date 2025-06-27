
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
          // If RPC fails, check user role as fallback
          return await checkUserRoleFallback(permissionType);
        }

        console.log(`🔒 [usePermissionCheck] Backend permission result for ${elementKey} (${permissionType}):`, data);
        return data as boolean;
      } catch (err) {
        console.error(`🔒 [usePermissionCheck] Exception checking permission for ${elementKey}:`, err);
        // If there's an exception, check user role as fallback
        return await checkUserRoleFallback(permissionType);
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  return {
    hasPermission: hasPermission ?? false,
    isLoading,
    error
  };
};

// Fallback function to check basic role permissions when RPC fails
const checkUserRoleFallback = async (permissionType: 'view' | 'edit') => {
  try {
    console.log('🔒 [usePermissionCheck] Using role fallback check');
    
    const { data, error } = await supabase.rpc('get_current_user_info');
    
    if (error || !data?.[0]) {
      console.error('🔒 [usePermissionCheck] Fallback failed - no user info');
      return false;
    }
    
    const userInfo = data[0];
    console.log('🔒 [usePermissionCheck] Fallback user info:', {
      role: userInfo.role_name,
      isAdmin: userInfo.is_admin,
      isCaseWorker: userInfo.is_case_worker,
      hasManagementAccess: userInfo.has_management_access
    });
    
    // Basic permission logic for common roles
    if (userInfo.is_super_admin || userInfo.is_admin || userInfo.has_management_access) {
      return true; // Admins get access to everything
    }
    
    if (userInfo.is_case_worker) {
      // Caseworkers get view access to most things, edit access to case-related items
      if (permissionType === 'view') {
        return true; // Caseworkers can view most content
      }
      // For edit permissions, be more restrictive but allow case management
      return true; // For now, allow caseworkers to edit - can be refined later
    }
    
    if (userInfo.is_citizen) {
      // Citizens get limited access
      return permissionType === 'view'; // Citizens can view but not edit most things
    }
    
    // Default deny for unknown roles
    return false;
  } catch (err) {
    console.error('🔒 [usePermissionCheck] Fallback exception:', err);
    return false;
  }
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
          try {
            const { data, error } = await supabase
              .rpc('current_user_has_frontend_permission', {
                p_element_key: perm.elementKey,
                p_permission_type: perm.permissionType
              });

            if (error) {
              console.error(`🔒 [useBulkPermissionCheck] RPC error for ${perm.elementKey}:`, error);
              // Use fallback for this permission
              results[`${perm.elementKey}.${perm.permissionType}`] = await checkUserRoleFallback(perm.permissionType);
            } else {
              results[`${perm.elementKey}.${perm.permissionType}`] = data as boolean;
            }
          } catch (err) {
            console.error(`🔒 [useBulkPermissionCheck] Exception for ${perm.elementKey}:`, err);
            results[`${perm.elementKey}.${perm.permissionType}`] = await checkUserRoleFallback(perm.permissionType);
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
    if (!userInfo) {
      console.log('🔒 [useAccessCheck] No user info available');
      return false;
    }

    console.log('🔒 [useAccessCheck] Checking access:', { module, screen, element_key, type, userRole: userInfo.role_name });

    // Build element key based on provided parameters
    let elementKey = module;
    if (screen) elementKey += `.${screen}`;
    if (element_key) elementKey += `.${element_key}`;
    
    // Basic role-based access logic as fallback
    if (userInfo.is_super_admin || userInfo.is_admin || userInfo.has_management_access) {
      console.log('🔒 [useAccessCheck] Admin access granted');
      return true;
    }

    if (userInfo.is_case_worker) {
      console.log('🔒 [useAccessCheck] Caseworker access check');
      // Caseworkers should have access to most functionality
      if (type === 'can_view') {
        return true; // Caseworkers can view most things
      }
      if (type === 'can_edit') {
        // Allow caseworkers to edit case-related functionality
        if (module === 'cases' || module === 'notifications' || module === 'dashboard') {
          return true;
        }
        // Restrict admin functions
        if (module.includes('admin') || module.includes('users_management') || module.includes('roles_management')) {
          return false;
        }
        return true; // Allow other edit operations
      }
    }

    if (userInfo.is_citizen) {
      console.log('🔒 [useAccessCheck] Citizen access check');
      // Citizens get limited access
      return type === 'can_view' && (module === 'cases' || module === 'dashboard' || module === 'notifications');
    }

    console.log('🔒 [useAccessCheck] Access denied - unknown role or insufficient permissions');
    return false;
  };

  return {
    hasAccess,
    isLoading,
    userInfo
  };
};
