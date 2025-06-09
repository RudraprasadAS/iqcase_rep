
import React from 'react';
import { useFieldPermission } from '@/hooks/useFieldPermissions';

interface FieldPermissionWrapperProps {
  moduleName: string;
  screenName: string;
  fieldName: string;
  children: React.ReactNode;
  requireEdit?: boolean;
  fallback?: React.ReactNode;
}

export const FieldPermissionWrapper: React.FC<FieldPermissionWrapperProps> = ({
  moduleName,
  screenName,
  fieldName,
  children,
  requireEdit = false,
  fallback = null
}) => {
  const { canView, canEdit, isLoading } = useFieldPermission(moduleName, screenName, fieldName);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-4 rounded"></div>;
  }

  const hasPermission = requireEdit ? canEdit : canView;

  if (!hasPermission) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// Component-specific permission wrappers
export const CaseFieldWrapper: React.FC<{
  fieldName: string;
  children: React.ReactNode;
  requireEdit?: boolean;
  fallback?: React.ReactNode;
}> = ({ fieldName, children, requireEdit, fallback }) => (
  <FieldPermissionWrapper
    moduleName="cases"
    screenName="detail"
    fieldName={fieldName}
    requireEdit={requireEdit}
    fallback={fallback}
  >
    {children}
  </FieldPermissionWrapper>
);

export const TaskFieldWrapper: React.FC<{
  fieldName: string;
  children: React.ReactNode;
  requireEdit?: boolean;
  fallback?: React.ReactNode;
}> = ({ fieldName, children, requireEdit, fallback }) => (
  <FieldPermissionWrapper
    moduleName="cases"
    screenName="tasks"
    fieldName={fieldName}
    requireEdit={requireEdit}
    fallback={fallback}
  >
    {children}
  </FieldPermissionWrapper>
);

export const MessageFieldWrapper: React.FC<{
  fieldName: string;
  children: React.ReactNode;
  requireEdit?: boolean;
  fallback?: React.ReactNode;
}> = ({ fieldName, children, requireEdit, fallback }) => (
  <FieldPermissionWrapper
    moduleName="cases"
    screenName="messages"
    fieldName={fieldName}
    requireEdit={requireEdit}
    fallback={fallback}
  >
    {children}
  </FieldPermissionWrapper>
);
