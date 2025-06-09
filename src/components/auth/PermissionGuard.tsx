
import React from 'react';
import { useFieldPermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  module: string;
  field?: string;
  action: 'view' | 'edit';
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  module,
  field,
  action,
  fallback = null
}) => {
  const { canViewField, canEditField, isLoading } = useFieldPermissions();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 w-20 rounded" />;
  }

  const hasPermission = action === 'view' 
    ? canViewField(module, field)
    : canEditField(module, field);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
