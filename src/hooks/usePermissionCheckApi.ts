import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

export const usePermissionCheckApi = (elementKey: string, permissionType: 'view' | 'edit' = 'view') => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['permission-check-api', elementKey, permissionType],
    queryFn: async () => {
      console.log(`🔒 [usePermissionCheckApi] Checking permission for ${elementKey} (${permissionType})`);
      
      try {
        const result = await apiService.checkPermission(elementKey, permissionType);
        console.log(`🔒 [usePermissionCheckApi] Permission result for ${elementKey} (${permissionType}):`, result);
        return (result as any)?.hasPermission || false;
      } catch (err) {
        console.error(`🔒 [usePermissionCheckApi] Exception checking permission for ${elementKey}:`, err);
        return false;
      }
    },
    staleTime: 1 * 60 * 1000, // Cache for 1 minute
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
  });

  return {
    hasPermission: data ?? false,
    isLoading,
    error
  };
};

// Bulk permission check for multiple elements
export const useBulkPermissionCheckApi = (permissions: Array<{ elementKey: string; permissionType: 'view' | 'edit' }>) => {
  const { data: permissionResults, isLoading, error } = useQuery({
    queryKey: ['bulk-permission-check-api', permissions],
    queryFn: async () => {
      console.log(`🔒 [useBulkPermissionCheckApi] Checking permissions for ${permissions.length} elements`);
      
      try {
        const result = await apiService.bulkCheckPermissions(permissions);
        console.log(`🔒 [useBulkPermissionCheckApi] Bulk permission results:`, (result as any)?.results);
        return (result as any)?.results || {};
      } catch (err) {
        console.error(`🔒 [useBulkPermissionCheckApi] Exception during bulk check:`, err);
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