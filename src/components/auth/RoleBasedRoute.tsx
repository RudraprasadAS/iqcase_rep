
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
  const { canAccessAdmin, canAccessCitizenPortal, isStaff, loading } = useRoleAccess();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check admin access
  if (requireAdmin && !canAccessAdmin()) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check citizen access
  if (requireCitizen && !canAccessCitizenPortal()) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check staff access
  if (requireStaff && !isStaff()) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
