
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Card, CardContent } from '@/components/ui/card';

interface ProtectedRouteProps {
  module: string;
  screen?: string;
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  module,
  screen,
  children,
  redirectTo = '/dashboard'
}) => {
  const { userInfo, isLoading: roleLoading } = useRoleAccess();
  const location = useLocation();

  // Build element key for permission check
  let elementKey = module;
  if (screen) elementKey += `.${screen}`;

  const { hasPermission, isLoading: permissionLoading } = usePermissionCheck(elementKey, 'view');

  console.log(`🔍 [ProtectedRoute] Checking ${elementKey} for user:`, userInfo?.role?.name);
  console.log(`🔍 [ProtectedRoute] Permission result:`, hasPermission, 'Loading:', permissionLoading);

  // Show loading state
  if (roleLoading || permissionLoading) {
    console.log(`🔍 [ProtectedRoute] Still loading for ${elementKey}`);
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Checking permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has access to this route using the permission system
  if (!hasPermission) {
    console.log(`🔍 [ProtectedRoute] Access denied for ${elementKey}`);
    
    // Instead of redirecting, show an access denied message to prevent infinite loops
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Role: {userInfo?.role?.name} | Page: {elementKey}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log(`🔍 [ProtectedRoute] Access granted for ${elementKey}`);
  return <>{children}</>;
};
