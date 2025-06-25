
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PermissionCheckResult {
  hasPermission: boolean;
  isLoading: boolean;
  error: Error | null;
}

interface AccessCheckParams {
  module: string;
  screen?: string;
  element_key?: string;
  type: 'can_view' | 'can_edit';
}

// Enhanced hook to check if current user has permission for a specific frontend element
export const usePermissionCheck = (
  elementKey: string,
  permissionType: 'view' | 'edit' = 'view'
): PermissionCheckResult => {
  const { data: hasPermission = false, isLoading, error } = useQuery({
    queryKey: ['frontend_permission', elementKey, permissionType],
    queryFn: async () => {
      console.log(`🔍 [Permission Check] Checking permission for element: ${elementKey}, type: ${permissionType}`);

      const { data, error } = await supabase.rpc('current_user_has_frontend_permission', {
        p_element_key: elementKey,
        p_permission_type: permissionType
      });

      if (error) {
        console.error('🔍 [Permission Check] RPC error:', error);
        throw error;
      }

      console.log(`🔍 [Permission Check] RPC result for ${elementKey}:`, data);
      
      return Boolean(data);
    },
    enabled: !!elementKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    hasPermission: Boolean(hasPermission),
    isLoading,
    error: error as Error | null
  };
};

// New comprehensive access check hook
export const useAccessCheck = () => {
  const { data: userInfo } = useQuery({
    queryKey: ['current_user_info'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_current_user_info');
      if (error) throw error;
      return data?.[0];
    },
  });

  const { data: userPermissions } = useQuery({
    queryKey: ['user_permissions', userInfo?.user_id],
    queryFn: async () => {
      if (!userInfo?.user_id) return [];
      
      const { data, error } = await supabase
        .from('permissions')
        .select(`
          can_view,
          can_edit,
          frontend_registry (
            element_key,
            module,
            screen,
            label
          )
        `)
        .eq('role_id', userInfo.role_id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userInfo?.user_id,
    staleTime: 5 * 60 * 1000,
  });

  const hasAccess = ({ module, screen, element_key, type }: AccessCheckParams): boolean => {
    // If user info is not loaded, deny access
    if (!userInfo) return false;

    // Super admins and admins have full access
    if (userInfo.is_super_admin || userInfo.is_admin) {
      console.log(`🔍 [Access Check] Admin access granted for ${element_key || module}`);
      return true;
    }

    // Build the full element key
    let fullElementKey = element_key;
    if (!fullElementKey) {
      // If no specific element key, check module-level access
      fullElementKey = module;
    }

    // Find the permission for this element
    const permission = userPermissions?.find(p => 
      p.frontend_registry?.element_key === fullElementKey
    );

    if (!permission) {
      console.log(`🔍 [Access Check] No permission found for ${fullElementKey}`);
      return false;
    }

    const hasPermission = type === 'can_view' ? permission.can_view : permission.can_edit;
    console.log(`🔍 [Access Check] Permission check for ${fullElementKey}: ${hasPermission}`);
    
    return hasPermission;
  };

  const isLoading = !userInfo || !userPermissions;

  return {
    hasAccess,
    isLoading,
    userInfo,
    userPermissions
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
          results[key] = Boolean(data);
        }
      }

      return results;
    },
    enabled: permissions.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    permissionResults,
    isLoading,
    error: error as Error | null
  };
};
