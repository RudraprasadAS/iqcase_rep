
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const usePermissionCheck = (elementKey: string, permissionType: 'view' | 'edit' = 'view') => {
  const { user } = useAuth();

  const { data: hasPermission = false, isLoading, error } = useQuery({
    queryKey: ["permission", elementKey, permissionType, user?.id],
    queryFn: async () => {
      if (!user) {
        console.log(`🔒 [usePermissionCheck] No user found for ${elementKey}`);
        return false;
      }

      console.log(`🔒 [usePermissionCheck] Checking ${permissionType} permission for ${elementKey}`);

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
          console.error(`🔒 [usePermissionCheck] Error fetching user data:`, userError);
          return false;
        }

        // If user has admin role or system role, grant access
        if (userData.roles.name === 'admin' || userData.roles.is_system) {
          console.log(`🔒 [usePermissionCheck] Admin/System role detected for ${elementKey} - granting access`);
          return true;
        }

        // Check frontend registry and permissions
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
          console.log(`🔒 [usePermissionCheck] No permission found for ${elementKey}:`, permError.message);
          return false;
        }

        const hasAccess = permissionType === 'view' ? permission.can_view : permission.can_edit;
        console.log(`🔒 [usePermissionCheck] Permission check result for ${elementKey}: ${hasAccess}`);
        
        return hasAccess;
      } catch (error) {
        console.error(`🔒 [usePermissionCheck] Exception checking permission for ${elementKey}:`, error);
        return false;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  return {
    hasPermission,
    isLoading,
    error
  };
};
