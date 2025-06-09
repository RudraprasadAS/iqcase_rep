
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  role: string;
  role_type?: string;
}

export const useRoleAccess = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRoles();
    }
  }, [user]);

  const fetchUserRoles = async () => {
    if (!user) return;

    try {
      // First get the internal user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        setLoading(false);
        return;
      }

      // Then get user roles
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          roles!inner(
            name,
            role_type,
            is_active
          )
        `)
        .eq('user_id', userData.id);

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        setLoading(false);
        return;
      }

      const activeRoles = userRolesData
        ?.filter(ur => ur.roles?.is_active !== false)
        ?.map(ur => ({
          role: ur.roles?.name || '',
          role_type: ur.roles?.role_type || undefined
        })) || [];

      setUserRoles(activeRoles);
    } catch (error) {
      console.error('Error in fetchUserRoles:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roleName: string): boolean => {
    return userRoles.some(ur => ur.role === roleName);
  };

  const hasRoleType = (roleType: string): boolean => {
    return userRoles.some(ur => ur.role_type === roleType);
  };

  const isAdmin = (): boolean => {
    return hasRole('Admin') || hasRole('Super Admin') || hasRoleType('admin');
  };

  const isCitizen = (): boolean => {
    return hasRole('Citizen') || hasRoleType('citizen');
  };

  const isStaff = (): boolean => {
    return hasRole('Staff') || hasRole('Case Manager') || hasRoleType('staff');
  };

  const canAccessAdmin = (): boolean => {
    return isAdmin() || isStaff();
  };

  const canAccessCitizenPortal = (): boolean => {
    return isCitizen();
  };

  return {
    userRoles,
    loading,
    hasRole,
    hasRoleType,
    isAdmin,
    isCitizen,
    isStaff,
    canAccessAdmin,
    canAccessCitizenPortal,
    refetch: fetchUserRoles
  };
};
