
export interface TableInfo {
  name: string;
  schema: string;
  fields: string[];
}

export interface Permission {
  id: string;
  role_id: string;
  module_name: string;
  field_name: string | null;
  can_view: boolean;
  can_edit: boolean;
}

export interface UnsavedPermission {
  roleId: string;
  moduleName: string;
  fieldName: string | null;
  canView: boolean;
  canEdit: boolean;
}
