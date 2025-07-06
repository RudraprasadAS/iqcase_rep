
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
  const { userInfo, isLoading, error, isInternal, isExternal } = useRoleAccess();

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
        </AlertDescription>
      </Alert>
    );
  }

  // Citizens should be treated as external users and redirected to citizen portal
  const isCitizen = userInfo.role?.name === 'citizen';
  
  if (isCitizen) {
    // Force citizens to citizen portal if they try to access internal routes
    if (requireInternal) {
      return <Navigate to="/citizen/dashboard" replace />;
    }
  }

  // Check user type restrictions
  if (requireInternal && !isInternal && !isCitizen) {
    return <Navigate to="/citizen/dashboard" replace />;
  }

  if (requireExternal && !isExternal && !isCitizen) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check allowed user types - treat citizens as external for permission purposes
  if (allowedUserTypes && !allowedUserTypes.includes(isCitizen ? 'external' : userInfo.user_type)) {
    return <Navigate to={isCitizen ? "/citizen/dashboard" : fallbackPath} replace />;
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(userInfo.role.name)) {
    return <Navigate to={isCitizen ? "/citizen/dashboard" : fallbackPath} replace />;
  }

  return <>{children}</>;
};
