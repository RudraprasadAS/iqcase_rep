
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
        console.log('❌ No authenticated user found');
        throw new Error('No authenticated user');
      }

      console.log('🔍 Fetching user info for auth user:', user.email, 'Auth ID:', user.id);

      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          user_type,
          email,
          name,
          auth_user_id,
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
        console.error('❌ Error fetching user info:', error);
        console.log('🔍 Trying to find user by email as fallback...');
        
        // Fallback: try to find by email
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select(`
            id,
            user_type,
            email,
            name,
            auth_user_id,
            roles:role_id (
              id,
              name,
              role_type,
              is_system
            )
          `)
          .eq('email', user.email)
          .single();

        if (emailError) {
          console.error('❌ Error fetching user by email:', emailError);
          throw emailError;
        }

        console.log('✅ Found user by email:', emailData);
        return {
          id: emailData.id,
          user_type: emailData.user_type,
          role: emailData.roles as UserRole
        } as UserInfo;
      }

      console.log('✅ User info fetched:', {
        id: data.id,
        email: data.email,
        user_type: data.user_type,
        role: data.roles,
        auth_user_id: data.auth_user_id
      });

      return {
        id: data.id,
        user_type: data.user_type,
        role: data.roles as UserRole
      } as UserInfo;
    },
  });

  // Define role hierarchy and access patterns - admin should have full access
  const isAdmin = userInfo?.role?.name === 'admin' || userInfo?.role?.name === 'super_admin';
  const isManager = userInfo?.role?.name === 'manager';
  const isCaseworker = userInfo?.role?.name === 'caseworker';
  const isViewer = userInfo?.role?.name === 'viewer';
  const isCitizen = userInfo?.role?.name === 'citizen';
  
  const isInternal = userInfo?.user_type === 'internal';
  const isExternal = userInfo?.user_type === 'external';

  // Define access levels based on RBAC spec - admin should have ALL permissions
  const hasFullAccess = isAdmin;
  const hasManagerAccess = isAdmin || isManager;
  const hasCaseworkerAccess = isAdmin || isManager || isCaseworker;
  const hasViewerAccess = isAdmin || isManager || isCaseworker || isViewer;
  const canEditCases = isAdmin || isManager || isCaseworker;
  const canViewInternalNotes = isAdmin || isManager;
  const canEditInternalNotes = isAdmin;

  console.log('🔑 Role access computed:', {
    userInfo,
    isAdmin,
    isManager,
    isCaseworker,
    isViewer,
    isCitizen,
    isInternal,
    isExternal,
    hasFullAccess,
    hasManagerAccess,
    hasCaseworkerAccess,
    canEditCases,
    roleName: userInfo?.role?.name
  });

  return {
    userInfo,
    isLoading,
    error,
    // Role checks
    isAdmin,
    isManager,
    isCaseworker,
    isViewer,
    isCitizen,
    // User type checks
    isInternal,
    isExternal,
    // Access level checks
    hasFullAccess,
    hasManagerAccess,
    hasCaseworkerAccess,
    hasViewerAccess,
    canEditCases,
    canViewInternalNotes,
    canEditInternalNotes,
    // Legacy compatibility
    hasAdminAccess: hasFullAccess,
    isSuperAdmin: isAdmin,
    isSystemRole: userInfo?.role?.is_system,
    roleName: userInfo?.role?.name,
    roleType: userInfo?.role?.role_type
  };
};
