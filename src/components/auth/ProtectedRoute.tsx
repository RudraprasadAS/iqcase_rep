
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

  // Check if user has access to this route using the new permission system
  if (!hasPermission) {
    console.log(`🔍 [ProtectedRoute] Access denied for ${elementKey}, redirecting to ${redirectTo}`);
    
    // Redirect to the specified route, but preserve the attempted location
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location, reason: 'access_denied', module, userRole: userInfo?.role?.name }}
        replace 
      />
    );
  }

  console.log(`🔍 [ProtectedRoute] Access granted for ${elementKey}`);
  return <>{children}</>;
};
