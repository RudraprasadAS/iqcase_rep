
import React from 'react';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

interface TabPermissionWrapperProps {
  elementKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const TabPermissionWrapper: React.FC<TabPermissionWrapperProps> = ({
  elementKey,
  children,
  fallback = null
}) => {
  const { hasPermission, isLoading } = usePermissionCheck(elementKey, 'view');

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
