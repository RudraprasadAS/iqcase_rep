
import React from 'react';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

interface PermissionWrapperProps {
  elementKey: string;
  permissionType: 'view' | 'edit';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionWrapper: React.FC<PermissionWrapperProps> = ({
  elementKey,
  permissionType,
  children,
  fallback = null
}) => {
  const { hasPermission, isLoading } = usePermissionCheck(elementKey, permissionType);

  // Show loading state if permission is still being checked
  if (isLoading) {
    return <div className="opacity-50">{children}</div>;
  }

  // If no permission, show fallback or nothing
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  // If has permission, show children
  return <>{children}</>;
};
