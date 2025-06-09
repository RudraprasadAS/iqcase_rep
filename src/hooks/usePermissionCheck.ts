
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
      console.log(`🔍 [Permission Check] Checking permission for element: ${elementKey}, type: ${permissionType}`);
      
      // First, let's check the user's role info
      const { data: userRole, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          auth_user_id,
          roles:role_id (
            id,
            name,
            is_system
          )
        `)
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
        
      console.log('🔍 [Permission Check] User role info:', userRole);
      
      // Check if frontend registry has the element
      const { data: registryElement, error: registryError } = await supabase
        .from('frontend_registry')
        .select('*')
        .eq('element_key', elementKey)
        .eq('is_active', true)
        .single();
        
      console.log('🔍 [Permission Check] Registry element:', registryElement);
      
      // Check existing permissions
      if (userRole && registryElement) {
        const { data: existingPermission, error: permError } = await supabase
          .from('permissions')
          .select('*')
          .eq('role_id', userRole.roles.id)
          .eq('frontend_registry_id', registryElement.id)
          .single();
          
        console.log('🔍 [Permission Check] Existing permission:', existingPermission);
      }

      const { data, error } = await supabase.rpc('current_user_has_frontend_permission', {
        p_element_key: elementKey,
        p_permission_type: permissionType
      });

      if (error) {
        console.error('🔍 [Permission Check] RPC error:', error);
        throw error;
      }

      console.log(`🔍 [Permission Check] RPC result for ${elementKey}:`, data);
      return data as boolean;
    },
    enabled: !!elementKey,
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
