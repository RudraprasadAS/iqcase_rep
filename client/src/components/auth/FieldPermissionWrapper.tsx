
import React from 'react';
import { usePermissionCheck } from '@/hooks/usePermissionCheck';

interface FieldPermissionWrapperProps {
  elementKey: string;
  permissionType?: 'view' | 'edit';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAsReadOnly?: boolean;
}

export const FieldPermissionWrapper: React.FC<FieldPermissionWrapperProps> = ({
  elementKey,
  permissionType = 'view',
  children,
  fallback = null,
  showAsReadOnly = true
}) => {
  const { hasPermission, isLoading } = usePermissionCheck(elementKey, permissionType);

  // Show loading state if permission is still being checked
  if (isLoading) {
    return <div className="opacity-50">{children}</div>;
  }

  // If no permission, either show as read-only or hide completely
  if (!hasPermission) {
    if (permissionType === 'edit' && showAsReadOnly) {
      // For edit permissions, check if user has view permission
      const { hasPermission: hasViewPermission } = usePermissionCheck(elementKey, 'view');
      if (hasViewPermission) {
        // Clone children and make them read-only/disabled
        const readOnlyChildren = React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              disabled: true,
              readOnly: true,
              className: `${child.props.className || ''} opacity-60 cursor-not-allowed`
            });
          }
          return child;
        });
        return <>{readOnlyChildren}</>;
      }
    }
    return <>{fallback}</>;
  }

  // If has permission, show children normally
  return <>{children}</>;
};
