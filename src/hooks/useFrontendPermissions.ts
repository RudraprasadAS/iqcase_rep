
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FrontendRegistryItem, RegistryPermission } from "@/types/frontend-registry";

// Hook to check if current user has permission for a specific UI element
export const useFrontendPermissionCheck = (elementKey: string, permissionType: 'view' | 'edit' = 'view') => {
  const { data: hasPermission = false, isLoading, error } = useQuery({
    queryKey: ['frontend_permission', elementKey, permissionType],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('current_user_has_frontend_permission', {
        p_element_key: elementKey,
        p_permission_type: permissionType
      });
      
      if (error) {
        console.error('Frontend permission check error:', error);
        throw error;
      }
      
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

// Hook to get all frontend registry items
export const useFrontendRegistry = () => {
  const { data: registryItems = [], isLoading, error } = useQuery({
    queryKey: ['frontend_registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('frontend_registry')
        .select('*')
        .eq('is_active', true)
        .order('module', { ascending: true })
        .order('screen', { ascending: true })
        .order('element_key', { ascending: true });
      
      if (error) {
        console.error('Error fetching frontend registry:', error);
        throw error;
      }
      
      return data as FrontendRegistryItem[];
    },
  });

  return {
    registryItems,
    isLoading,
    error: error as Error | null
  };
};

// Hook to get permissions for a specific role
export const useRolePermissions = (roleId: string) => {
  const { data: permissions = [], isLoading, error } = useQuery({
    queryKey: ['role_permissions', roleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select(`
          *,
          frontend_registry:frontend_registry_id (*)
        `)
        .eq('role_id', roleId);
      
      if (error) {
        console.error('Error fetching role permissions:', error);
        throw error;
      }
      
      return data as RegistryPermission[];
    },
    enabled: !!roleId,
  });

  return {
    permissions,
    isLoading,
    error: error as Error | null
  };
};

// Hook to check multiple frontend permissions at once
export const useBulkFrontendPermissionCheck = (elementKeys: string[], permissionType: 'view' | 'edit' = 'view') => {
  const { data: permissionResults = {}, isLoading, error } = useQuery({
    queryKey: ['bulk_frontend_permissions', elementKeys, permissionType],
    queryFn: async () => {
      const results: Record<string, boolean> = {};
      
      for (const elementKey of elementKeys) {
        const { data, error } = await supabase.rpc('current_user_has_frontend_permission', {
          p_element_key: elementKey,
          p_permission_type: permissionType
        });
        
        if (error) {
          console.error(`Frontend permission check error for ${elementKey}:`, error);
          results[elementKey] = false;
        } else {
          results[elementKey] = data as boolean;
        }
      }
      
      return results;
    },
    enabled: elementKeys.length > 0,
  });

  return {
    permissionResults,
    isLoading,
    error: error as Error | null
  };
};
