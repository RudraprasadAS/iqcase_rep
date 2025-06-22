
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PermissionRequest {
  elementKey: string;
  permissionType: 'view' | 'edit';
}

export const useBulkPermissionCheck = (permissions: PermissionRequest[]) => {
  const { user } = useAuth();

  const { data: permissionResults = {}, isLoading, error } = useQuery({
    queryKey: ["bulk-permissions", permissions, user?.id],
    queryFn: async () => {
      if (!user) {
        console.log(`🔒 [useBulkPermissionCheck] No user found`);
        return {};
      }

      console.log(`🔒 [useBulkPermissionCheck] Checking permissions for ${permissions.length} elements`);

      try {
        // Get current user's internal ID and role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select(`
            id, 
            role_id,
            roles!inner(name, is_system)
          `)
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single();

        if (userError || !userData) {
          console.error(`🔒 [useBulkPermissionCheck] Error fetching user data:`, userError);
          return {};
        }

        const results: Record<string, boolean> = {};

        // If user has admin role or system role, grant access to all
        if (userData.roles.name === 'admin' || userData.roles.is_system) {
          console.log(`🔒 [useBulkPermissionCheck] Admin/System role detected - granting all access`);
          permissions.forEach(({ elementKey, permissionType }) => {
            results[`${elementKey}.${permissionType}`] = true;
          });
          return results;
        }

        // Check each permission individually
        for (const { elementKey, permissionType } of permissions) {
          try {
            const { data: permission, error: permError } = await supabase
              .from('permissions')
              .select(`
                can_view,
                can_edit,
                frontend_registry!inner(element_key, is_active)
              `)
              .eq('role_id', userData.role_id)
              .eq('frontend_registry.element_key', elementKey)
              .eq('frontend_registry.is_active', true)
              .single();

            if (permError) {
              console.log(`🔒 [useBulkPermissionCheck] No permission found for ${elementKey}:`, permError.message);
              results[`${elementKey}.${permissionType}`] = false;
            } else {
              const hasAccess = permissionType === 'view' ? permission.can_view : permission.can_edit;
              results[`${elementKey}.${permissionType}`] = hasAccess;
            }
          } catch (error) {
            console.error(`🔒 [useBulkPermissionCheck] Exception checking permission for ${elementKey}:`, error);
            results[`${elementKey}.${permissionType}`] = false;
          }
        }

        console.log(`🔒 [useBulkPermissionCheck] Bulk permission results:`, results);
        return results;
      } catch (error) {
        console.error(`🔒 [useBulkPermissionCheck] Exception in bulk check:`, error);
        return {};
      }
    },
    enabled: !!user && permissions.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  return {
    permissionResults,
    isLoading,
    error
  };
};
