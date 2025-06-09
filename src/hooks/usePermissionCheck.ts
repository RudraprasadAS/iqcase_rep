
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

// Hook to get all permissions for the current user - this will help with dynamic menu generation
export const useUserPermissions = () => {
  const { data: userPermissions = [], isLoading, error } = useQuery({
    queryKey: ['user_permissions'],
    queryFn: async () => {
      console.log('[useUserPermissions] Fetching all user permissions');
      
      // Get current user info
      const { data: userInfo } = await supabase
        .from('users')
        .select(`
          id,
          role_id,
          roles:role_id (
            id,
            name,
            is_system
          )
        `)
        .eq('auth_user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!userInfo) {
        throw new Error('User not found');
      }

      // If user has a system role (like Super Admin), return permissions for all modules
      if (userInfo.roles?.is_system) {
        console.log('[useUserPermissions] User has system role, granting all permissions');
        // Get all available tables from database
        const { data: tables } = await supabase.rpc('get_tables_info');
        
        const allPermissions = tables?.map((table: any) => ({
          module_name: table.name,
          field_name: null,
          can_view: true,
          can_edit: true
        })) || [];

        return allPermissions;
      }

      // Get permissions from database for this role
      const { data: permissions, error } = await supabase
        .from('permissions')
        .select('module_name, field_name, can_view, can_edit')
        .eq('role_id', userInfo.role_id);

      if (error) {
        console.error('Error fetching user permissions:', error);
        throw error;
      }

      console.log('[useUserPermissions] User permissions:', permissions);
      return permissions || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    userPermissions,
    isLoading,
    error: error as Error | null
  };
};

// Hook to check specific menu/module access
export const useMenuPermissions = () => {
  const { userPermissions, isLoading, error } = useUserPermissions();

  // Create a permission checker function
  const hasModulePermission = (moduleName: string, permissionType: 'view' | 'edit' = 'view') => {
    if (!userPermissions) return false;
    
    // Check if user has permission for this module (either specific or table-level)
    const permission = userPermissions.find(p => 
      p.module_name === moduleName && 
      (p.field_name === null || p.field_name === undefined)
    );
    
    if (permission) {
      return permissionType === 'view' ? permission.can_view : permission.can_edit;
    }
    
    return false;
  };

  return {
    canViewAnalytics: hasModulePermission('analytics', 'view'),
    canViewReports: hasModulePermission('reports', 'view'),
    canViewAdmin: hasModulePermission('admin', 'view'),
    canViewUsers: hasModulePermission('users', 'view'),
    canViewPermissions: hasModulePermission('permissions', 'view'),
    canViewRoles: hasModulePermission('roles', 'view'),
    canViewDashboards: hasModulePermission('dashboards', 'view'),
    canViewInsights: hasModulePermission('insights', 'view'),
    canViewCases: hasModulePermission('cases', 'view'),
    canViewNotifications: hasModulePermission('notifications', 'view'),
    canViewKnowledge: hasModulePermission('knowledge_base', 'view'),
    // Add all available modules dynamically
    availableModules: userPermissions?.filter(p => p.can_view && p.field_name === null).map(p => p.module_name) || [],
    userPermissions,
    isLoading,
    error
  };
};
