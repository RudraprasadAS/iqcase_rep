
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedUserTypes?: string[];
  requireInternal?: boolean;
  requireExternal?: boolean;
  requiredPermission?: {
    moduleName: string;
    fieldName?: string;
    permissionType?: 'view' | 'edit';
  };
  fallbackPath?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  allowedUserTypes,
  requireInternal,
  requireExternal,
  requiredPermission,
  fallbackPath = '/'
}) => {
  const { userInfo, isLoading: roleLoading, error, isInternal, isExternal } = useRoleAccess();
  
  // Check permission if specified
  const { hasPermission, isLoading: permissionLoading } = usePermissionCheck(
    requiredPermission?.moduleName || '',
    requiredPermission?.fieldName,
    requiredPermission?.permissionType || 'view'
  );

  const isLoading = roleLoading || (requiredPermission && permissionLoading);

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

  // Check user type restrictions
  if (requireInternal && !isInternal) {
    return <Navigate to="/citizen/dashboard" replace />;
  }

  if (requireExternal && !isExternal) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check allowed user types
  if (allowedUserTypes && !allowedUserTypes.includes(userInfo.user_type)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check allowed roles
  if (allowedRoles && !allowedRoles.includes(userInfo.role.name)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check required permission
  if (requiredPermission && !hasPermission) {
    return (
      <Alert variant="destructive" className="m-4">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this page.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};
