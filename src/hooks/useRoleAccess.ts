
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UserInfo {
  user_id: string;
  role_name: string;
  role_type: string;
  user_type: string;
  is_active: boolean;
  is_admin: boolean;
  is_super_admin: boolean;
  is_case_worker: boolean;
  is_citizen: boolean;
  is_internal: boolean;
  is_external: boolean;
  has_management_access: boolean;
}

export const useRoleAccess = () => {
  const { data: userInfo, isLoading, error } = useQuery({
    queryKey: ['current_user_info'],
    queryFn: async () => {
      console.log('🔍 [useRoleAccess] Fetching user info from get_current_user_info()...');
      
      const { data, error } = await supabase.rpc('get_current_user_info');

      if (error) {
        console.error('🔍 [useRoleAccess] Error fetching user info:', error);
        throw error;
      }

      // The RPC returns an array with one object
      const userRecord = data?.[0] as UserInfo;
      
      if (!userRecord || !userRecord.user_id) {
        console.log('🔍 [useRoleAccess] No user found or user not active');
        return null;
      }

      console.log('🔍 [useRoleAccess] User info fetched successfully:', {
        userId: userRecord.user_id,
        userType: userRecord.user_type,
        roleName: userRecord.role_name,
        roleType: userRecord.role_type,
        isAdmin: userRecord.is_admin,
        isSuperAdmin: userRecord.is_super_admin,
        isCaseWorker: userRecord.is_case_worker,
        isCitizen: userRecord.is_citizen
      });

      return userRecord;
    },
  });

  // Extract role-based access flags
  const isCitizen = userInfo?.is_citizen || false;
  const isCaseWorker = userInfo?.is_case_worker || false;
  const isInternal = userInfo?.is_internal || false;
  const isExternal = userInfo?.is_external || false;
  const isAdmin = userInfo?.is_admin || false;
  const isSuperAdmin = userInfo?.is_super_admin || false;
  const isSystemRole = false; // We can add this to the DB function later if needed
  const hasManagementAccess = userInfo?.has_management_access || false;

  // Derive additional access permissions
  const hasFullCasesAccess = hasManagementAccess;
  const canViewCases = hasFullCasesAccess || isCaseWorker;
  const canCreateCases = hasManagementAccess; // Only admins can create cases
  const canAssignCases = hasManagementAccess;

  console.log('🔍 [useRoleAccess] Final role evaluation:', {
    roleName: userInfo?.role_name,
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
    userInfo: userInfo ? {
      id: userInfo.user_id,
      user_type: userInfo.user_type,
      role: {
        id: userInfo.user_id, // We don't have separate role ID, using user ID
        name: userInfo.role_name,
        role_type: userInfo.role_type,
        is_system: false // We can add this to the DB function later if needed
      }
    } : null,
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
    roleName: userInfo?.role_name,
    roleType: userInfo?.role_type
  };
};
