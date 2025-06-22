
import { useBulkPermissionCheck } from './useBulkPermissionCheck';

// Hook specifically for checking field-level permissions in forms and tables
export const useFieldPermissions = (moduleName: string, fields: string[]) => {
  const permissions = fields.flatMap(field => [
    { elementKey: `${moduleName}.${field}`, permissionType: 'view' as const },
    { elementKey: `${moduleName}.${field}`, permissionType: 'edit' as const }
  ]);

  const { permissionResults, isLoading, error } = useBulkPermissionCheck(permissions);

  const canViewField = (fieldName: string) => {
    const key = `${moduleName}.${fieldName}.view`;
    return permissionResults[key] || false;
  };

  const canEditField = (fieldName: string) => {
    const key = `${moduleName}.${fieldName}.edit`;
    return permissionResults[key] || false;
  };

  const getVisibleFields = () => {
    return fields.filter(field => canViewField(field));
  };

  const getEditableFields = () => {
    return fields.filter(field => canEditField(field));
  };

  return {
    canViewField,
    canEditField,
    getVisibleFields,
    getEditableFields,
    isLoading,
    error
  };
};
