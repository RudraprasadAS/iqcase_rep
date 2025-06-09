
import React from 'react';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  elementKey: string;
  permissionType?: 'view' | 'edit';
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  elementKey,
  permissionType = 'view',
  fallback = null,
  showError = false
}) => {
  const { userInfo, isLoading: roleLoading } = useRoleAccess();
  const { hasPermission, isLoading, error } = usePermissionCheck(
    elementKey,
    permissionType
  );

  // If user is super admin or admin, grant access
  if (userInfo?.role?.name === 'super_admin' || userInfo?.role?.name === 'admin') {
    return <>{children}</>;
  }

  if (isLoading || roleLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }

  if (error && showError) {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Error checking permissions: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
