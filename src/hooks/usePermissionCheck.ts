
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
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  return {
    hasPermission: hasPermission ?? false,
    isLoading,
    error
  };
};
