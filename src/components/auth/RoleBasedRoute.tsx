
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
  requireAdmin?: boolean;
  requireManager?: boolean;
  requireCaseworker?: boolean;
  fallbackPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  allowedUserTypes,
  requireInternal,
  requireExternal,
  requireAdmin,
  requireManager,
  requireCaseworker,
  fallbackPath = '/dashboard'
}) => {
  const { 
    userInfo, 
    isLoading, 
    error, 
    isInternal, 
    isExternal, 
    isAdmin,
    isManager,
    isCaseworker,
    hasFullAccess,
    hasManagerAccess,
    hasCaseworkerAccess
  } = useRoleAccess();

  console.log('🔐 RoleBasedRoute check:', {
    userInfo,
    isLoading,
    error,
    requireInternal,
    requireExternal,
    requireAdmin,
    requireManager,
    requireCaseworker,
    isAdmin,
    isInternal,
    isExternal
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    console.error('🚨 RoleBasedRoute error:', error);
    return (
      <Alert variant="destructive" className="m-4">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Unable to verify user permissions. Please try refreshing the page.
          Error: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!userInfo) {
    console.log('❌ No user info found, redirecting to login');
    return <Navigate to="/auth/login" replace />;
  }

  // Admin bypasses all restrictions
  if (isAdmin) {
    console.log('✅ Admin access granted, bypassing all restrictions');
    return <>{children}</>;
  }

  // Check specific role requirements
  if (requireAdmin && !isAdmin) {
    console.log('❌ Admin access required but user is not admin');
    return <Navigate to={isExternal ? "/citizen/dashboard" : "/dashboard"} replace />;
  }

  if (requireManager && !hasManagerAccess) {
    console.log('❌ Manager access required but user does not have manager access');
    return <Navigate to={isExternal ? "/citizen/dashboard" : "/dashboard"} replace />;
  }

  if (requireCaseworker && !hasCaseworkerAccess) {
    console.log('❌ Caseworker access required but user does not have caseworker access');
    return <Navigate to={isExternal ? "/citizen/dashboard" : "/dashboard"} replace />;
  }

  // Check user type restrictions
  if (requireInternal && !isInternal) {
    console.log('❌ Internal access required but user is external, redirecting to citizen dashboard');
    return <Navigate to="/citizen/dashboard" replace />;
  }

  if (requireExternal && !isExternal) {
    console.log('❌ External access required but user is internal, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Check allowed user types
  if (allowedUserTypes && !allowedUserTypes.includes(userInfo.user_type)) {
    console.log('❌ User type not allowed:', userInfo.user_type, 'Allowed:', allowedUserTypes);
    return <Navigate to={fallbackPath} replace />;
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(userInfo.role.name)) {
    console.log('❌ Role not allowed:', userInfo.role.name, 'Allowed:', allowedRoles);
    return <Navigate to={fallbackPath} replace />;
  }

  console.log('✅ Access granted for role:', userInfo.role.name, 'user_type:', userInfo.user_type);
  return <>{children}</>;
};
