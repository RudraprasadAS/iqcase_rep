
import React from 'react';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  moduleName: string;
  fieldName?: string | null;
  permissionType?: 'view' | 'edit';
  fallback?: React.ReactNode;
  showError?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  moduleName,
  fieldName,
  permissionType = 'view',
  fallback = null,
  showError = false
}) => {
  const { hasPermission, isLoading, error } = usePermissionCheck(
    moduleName,
    fieldName,
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
