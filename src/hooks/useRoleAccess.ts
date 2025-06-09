
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
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserRoles = async () => {
    if (!user) return;

    try {
      // First get the internal user ID and role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          role_id,
          roles!inner(
            name,
            role_type,
            is_active
          )
        `)
        .eq('auth_user_id', user.id)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        setLoading(false);
        return;
      }

      // Set user roles based on the direct role relationship
      const roles: UserRole[] = [];
      if (userData.roles && userData.roles.is_active !== false) {
        roles.push({
          role: userData.roles.name,
          role_type: userData.roles.role_type || undefined
        });
      }

      setUserRoles(roles);
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
