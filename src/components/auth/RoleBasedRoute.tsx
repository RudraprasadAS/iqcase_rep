
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
    loading 
  } = useRoleAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user has no active role, redirect to home with error message
  if (!hasActiveRole()) {
    console.warn('Access denied: User has no active role or account is inactive');
    return <Navigate to="/" replace />;
  }

  // Check admin access
  if (requireAdmin && !canAccessAdmin()) {
    console.warn('Access denied: Admin access required');
    return <Navigate to={fallbackPath} replace />;
  }

  // Check citizen access
  if (requireCitizen && !canAccessCitizenPortal()) {
    console.warn('Access denied: Citizen access required');
    return <Navigate to={fallbackPath} replace />;
  }

  // Check staff access
  if (requireStaff && !isStaff()) {
    console.warn('Access denied: Staff access required');
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
