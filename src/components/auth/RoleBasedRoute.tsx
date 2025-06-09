
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Loader2 } from 'lucide-react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireCitizen?: boolean;
  requireStaff?: boolean;
  fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requireAdmin = false,
  requireCitizen = false,
  requireStaff = false,
  fallbackPath = '/'
}) => {
  const { 
    canAccessAdmin, 
    canAccessCitizenPortal, 
    isStaff, 
    hasActiveRole,
    loading,
    debugUserAccess
  } = useRoleAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Debug logging when access is denied
  const logAccessDenial = (reason: string) => {
    console.warn('Access denied:', reason);
    debugUserAccess();
  };

  // If user has no active role, redirect to home
  if (!hasActiveRole()) {
    logAccessDenial('User has no active role or account is inactive');
    return <Navigate to="/" replace />;
  }

  // Check admin access
  if (requireAdmin && !canAccessAdmin()) {
    logAccessDenial('Admin access required but user does not have admin permissions');
    return <Navigate to={fallbackPath} replace />;
  }

  // Check citizen access
  if (requireCitizen && !canAccessCitizenPortal()) {
    logAccessDenial('Citizen access required but user does not have citizen permissions');
    return <Navigate to={fallbackPath} replace />;
  }

  // Check staff access
  if (requireStaff && !isStaff()) {
    logAccessDenial('Staff access required but user does not have staff permissions');
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
