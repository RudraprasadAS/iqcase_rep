
import React from 'react';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

interface ButtonPermissionWrapperProps {
  elementKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ButtonPermissionWrapper: React.FC<ButtonPermissionWrapperProps> = ({
  elementKey,
  children,
  fallback = null
}) => {
  const { hasPermission, isLoading } = usePermissionCheck(elementKey, 'edit');

  // Show loading state if permission is still being checked
  if (isLoading) {
    return <div className="opacity-50 pointer-events-none">{children}</div>;
  }

  // If no permission, show fallback or nothing
  if (!hasPermission) {
    return <>{fallback}</>;
  }

  // If has permission, show children
  return <>{children}</>;
};
