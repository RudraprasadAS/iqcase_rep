
import React from 'react';
import { useFrontendPermissionCheck } from '@/hooks/useFrontendPermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface FrontendPermissionGuardProps {
  children: React.ReactNode;
  elementKey: string;
  permissionType?: 'view' | 'edit';
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const FrontendPermissionGuard: React.FC<FrontendPermissionGuardProps> = ({
  children,
  elementKey,
  permissionType = 'view',
  fallback = null,
  showError = false
}) => {
  const { hasPermission, isLoading, error } = useFrontendPermissionCheck(
    elementKey,
    permissionType
  );

  if (isLoading) {
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
