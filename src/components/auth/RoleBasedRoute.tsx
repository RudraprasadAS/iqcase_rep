
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedUserTypes?: string[];
  requireInternal?: boolean;
  requireExternal?: boolean;
  fallbackPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  allowedUserTypes,
  requireInternal,
  requireExternal,
  fallbackPath = '/'
}) => {
  const { userInfo, isLoading, error, isInternal, isExternal, isSuperAdmin, hasAdminAccess } = useRoleAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !userInfo) {
    return (
      <Alert variant="destructive" className="m-4">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Unable to verify user permissions. Please try logging in again.
          {error && ` Error: ${error.message}`}
        </AlertDescription>
      </Alert>
    );
  }

  // Super admin bypasses all restrictions
  if (isSuperAdmin) {
    console.log('Super admin access granted, bypassing all restrictions');
    return <>{children}</>;
  }

  // Check user type restrictions
  if (requireInternal && !isInternal) {
    console.log('Internal access required but user is external, redirecting to citizen dashboard');
    return <Navigate to="/citizen/dashboard" replace />;
  }

  if (requireExternal && !isExternal) {
    console.log('External access required but user is internal, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Check allowed user types
  if (allowedUserTypes && !allowedUserTypes.includes(userInfo.user_type)) {
    console.log('User type not allowed:', userInfo.user_type, 'Allowed:', allowedUserTypes);
    return <Navigate to={fallbackPath} replace />;
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(userInfo.role.name)) {
    console.log('Role not allowed:', userInfo.role.name, 'Allowed:', allowedRoles);
    return <Navigate to={fallbackPath} replace />;
  }

  console.log('Access granted for role:', userInfo.role.name);
  return <>{children}</>;
};
