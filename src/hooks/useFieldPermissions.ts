
import { useBulkFrontendPermissionCheck } from './useFrontendPermissions';

// Hook specifically for checking field-level permissions in forms and tables
export const useFieldPermissions = (moduleName: string, fields: string[]) => {
  // Create element keys for each field (assuming convention: moduleName.fieldName)
  const elementKeys = fields.flatMap(field => [
    `${moduleName}.${field}`, // Create element key from module and field
  ]);

  const { permissionResults: viewResults, isLoading: viewLoading } = useBulkFrontendPermissionCheck(elementKeys, 'view');
  const { permissionResults: editResults, isLoading: editLoading } = useBulkFrontendPermissionCheck(elementKeys, 'edit');

  const canViewField = (fieldName: string) => {
    const elementKey = `${moduleName}.${fieldName}`;
    return viewResults[elementKey] || false;
  };

  const canEditField = (fieldName: string) => {
    const elementKey = `${moduleName}.${fieldName}`;
    return editResults[elementKey] || false;
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
    isLoading: viewLoading || editLoading,
    error: null
  };
};
