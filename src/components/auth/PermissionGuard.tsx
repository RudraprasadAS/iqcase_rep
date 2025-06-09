
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

  console.log(`🔒 [PermissionGuard] Checking ${elementKey} (${permissionType}) for user:`, userInfo?.role?.name);
  console.log(`🔒 [PermissionGuard] Has permission:`, hasPermission, 'Loading:', isLoading, 'Error:', error);

  if (isLoading || roleLoading) {
    console.log(`🔒 [PermissionGuard] Still loading permissions for ${elementKey}`);
    return <div className="animate-pulse bg-gray-200 h-4 w-full rounded"></div>;
  }

  if (error && showError) {
    console.log(`🔒 [PermissionGuard] Permission error for ${elementKey}:`, error);
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Error checking permissions: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // IMPORTANT: Only grant access if permission is explicitly TRUE
  if (!hasPermission) {
    console.log(`🔒 [PermissionGuard] ACCESS DENIED for ${elementKey} - User: ${userInfo?.role?.name}`);
    return <>{fallback}</>;
  }

  console.log(`🔒 [PermissionGuard] ACCESS GRANTED for ${elementKey} - User: ${userInfo?.role?.name}`);
  return <>{children}</>;
};
