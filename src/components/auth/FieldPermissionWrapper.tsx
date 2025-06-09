
import React from 'react';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

interface FieldPermissionWrapperProps {
  children: React.ReactNode;
  moduleName: string;
  fieldName: string;
  permissionType?: 'view' | 'edit';
  fallback?: React.ReactNode;
}

export const FieldPermissionWrapper: React.FC<FieldPermissionWrapperProps> = ({
  children,
  moduleName,
  fieldName,
  permissionType = 'view',
  fallback = null
}) => {
  const { hasPermission, isLoading } = usePermissionCheck(
    moduleName,
    fieldName,
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
