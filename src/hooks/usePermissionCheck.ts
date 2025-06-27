
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const usePermissionCheck = (elementKey: string, permissionType: 'view' | 'edit' = 'view') => {
  const { data: hasPermission, isLoading, error } = useQuery({
    queryKey: ['permission-check', elementKey, permissionType],
    queryFn: async () => {
      console.log(`🔒 [usePermissionCheck] Checking permission for ${elementKey} (${permissionType})`);
      
      try {
        // First, let's see what user info we have
        const { data: userInfo, error: userError } = await supabase.rpc('get_current_user_info');
        if (userError) {
          console.error(`🔒 [usePermissionCheck] Error getting user info:`, userError);
          return false;
        }
        
        const currentUser = userInfo?.[0];
        if (!currentUser) {
          console.error(`🔒 [usePermissionCheck] No user found`);
          return false;
        }
        
        console.log(`🔒 [usePermissionCheck] Current user info:`, currentUser);

        // For admin users, allow access to everything
        if (currentUser.is_admin || currentUser.is_super_admin) {
          console.log(`🔒 [usePermissionCheck] Admin user - allowing access to ${elementKey}`);
          return true;
        }

        // For caseworker users, allow access to core functionality including reports
        if (currentUser.is_case_worker || currentUser.role_name === 'caseworker') {
          const allowedElements = [
            'dashboard',
            'dashboards', // Add plural form
            'cases',
            'cases.create_case',
            'cases.edit_case',
            'cases.assign_case',
            'cases.view_details',
            'notifications',
            'notifications.mark_read',
            'reports',
            'reports.create_report',
            'reports.edit_report',
            'reports.view_report',
            'reports.delete_report',
            'knowledge',
            'insights'
          ];
          
          if (allowedElements.includes(elementKey)) {
            console.log(`🔒 [usePermissionCheck] Caseworker accessing allowed element ${elementKey} - permitting`);
            return true;
          }
        }

        // For citizen users, allow access to citizen-specific features
        if (currentUser.is_citizen) {
          if (elementKey.startsWith('citizen')) {
            console.log(`🔒 [usePermissionCheck] Citizen accessing citizen element ${elementKey} - permitting`);
            return true;
          }
        }

        // Use the backend function to check permissions as fallback
        const { data, error } = await supabase
          .rpc('current_user_has_frontend_permission', {
            p_element_key: elementKey,
            p_permission_type: permissionType
          });

        if (error) {
          console.error(`🔒 [usePermissionCheck] RPC error for ${elementKey}:`, error);
          return false;
        }

        console.log(`🔒 [usePermissionCheck] Backend permission result for ${elementKey} (${permissionType}):`, data);
        return data as boolean;
      } catch (err) {
        console.error(`🔒 [usePermissionCheck] Exception checking permission for ${elementKey}:`, err);
        return false;
      }
    },
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
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
          try {
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
          } catch (err) {
            console.error(`🔒 [useBulkPermissionCheck] Exception for ${perm.elementKey}:`, err);
            results[`${perm.elementKey}.${perm.permissionType}`] = false;
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

// Legacy compatibility - useAccessCheck with improved backend integration
export const useAccessCheck = () => {
  const { data: userInfo, isLoading } = useQuery({
    queryKey: ['current-user-info'],
    queryFn: async () => {
      console.log('🔒 [useAccessCheck] Fetching current user info');
      
      try {
        const { data, error } = await supabase.rpc('get_current_user_info');

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
    
    // For admin users, allow access
    if (userInfo.is_admin || userInfo.is_super_admin) {
      console.log('🔒 [useAccessCheck] Admin user - allowing access');
      return true;
    }
    
    // For caseworker users, allow basic access to core modules
    if (userInfo.is_case_worker) {
      const allowedModules = ['dashboard', 'cases', 'notifications', 'reports', 'knowledge', 'insights'];
      if (allowedModules.some(mod => elementKey.startsWith(mod))) {
        console.log('🔒 [useAccessCheck] Caseworker accessing allowed module - permitting');
        return true;
      }
    }
    
    // For citizen users, allow access to citizen modules
    if (userInfo.is_citizen) {
      if (elementKey.startsWith('citizen')) {
        console.log('🔒 [useAccessCheck] Citizen accessing citizen module - permitting');
        return true;
      }
    }
    
    console.log('🔒 [useAccessCheck] Access denied - no matching permission found');
    return false;
  };

  return {
    hasAccess,
    isLoading,
    userInfo
  };
};
