
import React from 'react';
import { useFrontendPermissionCheck } from '@/hooks/useFrontendPermissions';

interface FieldPermissionWrapperProps {
  children: React.ReactNode;
  elementKey: string;
  permissionType?: 'view' | 'edit';
  fallback?: React.ReactNode;
}

export const FieldPermissionWrapper: React.FC<FieldPermissionWrapperProps> = ({
  children,
  elementKey,
  permissionType = 'view',
  fallback = null
}) => {
  const { hasPermission, isLoading } = useFrontendPermissionCheck(
    elementKey,
    permissionType
  );

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>;
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
