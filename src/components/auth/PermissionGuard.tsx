
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
  console.log(`🔒 [PermissionGuard] Backend permission result:`, hasPermission, 'Loading:', isLoading, 'Error:', error);

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

  // CRITICAL: Check backend permission first, then fallback to role-based check
  if (hasPermission) {
    console.log(`🔒 [PermissionGuard] ACCESS GRANTED for ${elementKey} - Backend returned true`);
    return <>{children}</>;
  }

  // Fallback role-based check if backend permission check failed or returned false
  if (userInfo) {
    console.log(`🔒 [PermissionGuard] Backend denied, checking role fallback for ${userInfo.role?.name}`);
    
    // Super admin and admin always get access
    if (userInfo.role?.name === 'super_admin' || userInfo.role?.name === 'admin') {
      console.log(`🔒 [PermissionGuard] ACCESS GRANTED for ${elementKey} - Admin role override`);
      return <>{children}</>;
    }
    
    // Caseworkers get generous access for view permissions
    if (userInfo.role?.name === 'caseworker' || userInfo.role?.name === 'case_worker') {
      if (permissionType === 'view') {
        console.log(`🔒 [PermissionGuard] ACCESS GRANTED for ${elementKey} - Caseworker view access`);
        return <>{children}</>;
      }
      
      // For edit permissions, allow case-related functionality
      if (permissionType === 'edit' && (
        elementKey.includes('cases') || 
        elementKey.includes('dashboard') || 
        elementKey.includes('notifications') ||
        elementKey.includes('reports')
      )) {
        console.log(`🔒 [PermissionGuard] ACCESS GRANTED for ${elementKey} - Caseworker edit access`);
        return <>{children}</>;
      }
    }
  }

  console.log(`🔒 [PermissionGuard] ACCESS DENIED for ${elementKey} - All checks failed`);
  return <>{fallback}</>;
};
