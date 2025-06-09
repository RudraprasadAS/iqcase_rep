
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
      console.log(`[usePermissionCheck] Checking permission: ${moduleName}.${fieldName || '*'} (${permissionType})`);
      
      const { data, error } = await supabase.rpc('current_user_can_access', {
        p_module_name: moduleName,
        p_field_name: fieldName,
        p_permission_type: permissionType
      });
      
      if (error) {
        console.error('Permission check error:', error);
        throw error;
      }
      
      console.log(`[usePermissionCheck] Result for ${moduleName}.${fieldName || '*'} (${permissionType}):`, data);
      return data as boolean;
    },
    enabled: !!moduleName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
      console.log('[useBulkPermissionCheck] Checking bulk permissions:', permissions);
      const results: Record<string, boolean> = {};
      
      for (const perm of permissions) {
        const key = `${perm.moduleName}${perm.fieldName ? `.${perm.fieldName}` : ''}.${perm.permissionType || 'view'}`;
        
        try {
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
        } catch (e) {
          console.error(`Exception checking permission for ${key}:`, e);
          results[key] = false;
        }
      }
      
      console.log('[useBulkPermissionCheck] Results:', results);
      return results;
    },
    enabled: permissions.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    permissionResults,
    isLoading,
    error: error as Error | null
  };
};

// Hook to check specific menu/module access
export const useMenuPermissions = () => {
  const permissions = [
    { moduleName: 'analytics', permissionType: 'view' as const },
    { moduleName: 'reports', permissionType: 'view' as const },
    { moduleName: 'admin', permissionType: 'view' as const },
    { moduleName: 'users', permissionType: 'view' as const },
    { moduleName: 'permissions', permissionType: 'view' as const },
    { moduleName: 'roles', permissionType: 'view' as const },
    { moduleName: 'dashboards', permissionType: 'view' as const },
    { moduleName: 'insights', permissionType: 'view' as const },
  ];

  const { permissionResults, isLoading, error } = useBulkPermissionCheck(permissions);

  return {
    canViewAnalytics: permissionResults['analytics.view'] || false,
    canViewReports: permissionResults['reports.view'] || false,
    canViewAdmin: permissionResults['admin.view'] || false,
    canViewUsers: permissionResults['users.view'] || false,
    canViewPermissions: permissionResults['permissions.view'] || false,
    canViewRoles: permissionResults['roles.view'] || false,
    canViewDashboards: permissionResults['dashboards.view'] || false,
    canViewInsights: permissionResults['insights.view'] || false,
    isLoading,
    error
  };
};
