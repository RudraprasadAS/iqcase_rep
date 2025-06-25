
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAccessCheck } from '@/hooks/usePermissionCheck';
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
  const { hasAccess, isLoading, userInfo } = useAccessCheck();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
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

  // Check if user has access to this route
  const hasRouteAccess = hasAccess({ module, screen, type: 'can_view' });

  if (!hasRouteAccess) {
    console.log(`🔍 [ProtectedRoute] Access denied for ${module}/${screen}, redirecting to ${redirectTo}`);
    
    // Redirect to the specified route, but preserve the attempted location
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location, reason: 'access_denied', module, userRole: userInfo?.role_name }}
        replace 
      />
    );
  }

  return <>{children}</>;
};
