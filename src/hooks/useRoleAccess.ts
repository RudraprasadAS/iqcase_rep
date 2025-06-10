
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
      console.log('🔍 [useRoleAccess] Starting to fetch user info...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('🔍 [useRoleAccess] No authenticated user found');
        throw new Error('No authenticated user');
      }

      console.log('🔍 [useRoleAccess] Authenticated user found:', user.id);

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
        console.error('🔍 [useRoleAccess] Error fetching user info:', error);
        throw error;
      }

      console.log('🔍 [useRoleAccess] User info fetched successfully:', {
        userId: data.id,
        userType: data.user_type,
        roleName: data.roles?.name,
        roleType: data.roles?.role_type
      });

      return {
        id: data.id,
        user_type: data.user_type,
        role: data.roles as UserRole
      } as UserInfo;
    },
  });

  // Treat citizens as external users for access control
  const isCitizen = userInfo?.role?.name === 'citizen';
  const isCaseWorker = userInfo?.role?.name === 'case_worker';
  const isInternal = userInfo?.user_type === 'internal' && !isCitizen;
  const isExternal = userInfo?.user_type === 'external' || isCitizen;
  const isAdmin = userInfo?.role?.name === 'admin';
  const isSuperAdmin = userInfo?.role?.name === 'super_admin';
  const isSystemRole = userInfo?.role?.is_system;

  // Check if user has management access (can create cases, export, etc.)
  const hasManagementAccess = isAdmin || isSuperAdmin;
  
  // Check if user has full cases access (can see all cases)
  const hasFullCasesAccess = isAdmin || isSuperAdmin;

  // Case workers have limited access - they can see assigned cases but not all management features
  const canViewCases = hasFullCasesAccess || isCaseWorker;
  const canCreateCases = hasManagementAccess; // Only admins can create cases
  const canAssignCases = hasManagementAccess;

  console.log('🔍 [useRoleAccess] Final role evaluation:', {
    roleName: userInfo?.role?.name,
    userType: userInfo?.user_type,
    isCitizen,
    isCaseWorker,
    isAdmin,
    isSuperAdmin,
    isInternal,
    isExternal,
    canViewCases,
    canCreateCases,
    hasFullCasesAccess,
    hasManagementAccess
  });

  return {
    userInfo,
    isLoading,
    error,
    isInternal,
    isExternal,
    isCitizen,
    isCaseWorker,
    isAdmin,
    isSuperAdmin,
    isSystemRole,
    hasManagementAccess,
    hasFullCasesAccess,
    canViewCases,
    canCreateCases,
    canAssignCases,
    roleName: userInfo?.role?.name,
    roleType: userInfo?.role?.role_type
  };
};
