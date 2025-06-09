
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "./useRoleAccess";

export const useModulePermission = (moduleName: string, fieldName?: string) => {
  const { userInfo, isAdmin } = useRoleAccess();
  
  const { data: permissions } = useQuery({
    queryKey: ['module_permissions', userInfo?.role?.id, moduleName, fieldName],
    queryFn: async () => {
      if (!userInfo?.role?.id) return null;
      
      console.log('Checking permissions for:', { moduleName, fieldName, roleId: userInfo.role.id });
      
      const { data, error } = await supabase
        .from('permissions')
        .select('can_view, can_edit')
        .eq('role_id', userInfo.role.id)
        .eq('module_name', moduleName)
        .eq('field_name', fieldName || null)
        .maybeSingle();

      if (error) {
        console.error('Error fetching permissions:', error);
        return null;
      }

      console.log('Permissions result:', data);
      return data;
    },
    enabled: !!userInfo?.role?.id,
  });

  // Admin always has full access
  if (isAdmin) {
    return {
      hasViewPermission: true,
      hasEditPermission: true
    };
  }

  return {
    hasViewPermission: permissions?.can_view || false,
    hasEditPermission: permissions?.can_edit || false
  };
};
