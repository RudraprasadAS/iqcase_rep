
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserRole {
  id: string;
  name: string;
  role_type: string;
  is_system: boolean;
}

interface UserInfo {
  id: string;
  user_type: string;
  role: UserRole;
}

export const useRoleAccess = () => {
  const { data: userInfo, isLoading, error } = useQuery({
    queryKey: ['current_user_info'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      console.log('[useRoleAccess] Current auth user:', user.email);

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          user_type,
          roles:role_id (
            id,
            name,
            role_type,
            is_system
          )
        `)
        .eq('auth_user_id', user.id)
        .single();

      if (error) {
        console.error('[useRoleAccess] Error fetching user data:', error);
        throw error;
      }

      console.log('[useRoleAccess] User data from database:', data);

      return {
        id: data.id,
        user_type: data.user_type,
        role: data.roles as UserRole
      } as UserInfo;
    },
  });

  const isInternal = userInfo?.user_type === 'internal';
  const isExternal = userInfo?.user_type === 'external';
  const isCitizen = userInfo?.role?.name === 'citizen';
  const isAdmin = userInfo?.role?.name === 'admin';
  const isSystemRole = userInfo?.role?.is_system;

  // Debug logging
  console.log('[useRoleAccess] Current user info:', {
    userInfo,
    isInternal,
    isExternal,
    isCitizen,
    isAdmin,
    isSystemRole,
    roleName: userInfo?.role?.name
  });

  return {
    userInfo,
    isLoading,
    error,
    isInternal,
    isExternal,
    isCitizen,
    isAdmin,
    isSystemRole,
    roleName: userInfo?.role?.name,
    roleType: userInfo?.role?.role_type
  };
};
