
import { FrontendRegistryItem } from './frontend-registry';

export interface Permission {
  id: string;
  role_id: string;
  frontend_registry_id: string;
  can_view: boolean;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
  frontend_registry?: FrontendRegistryItem;
}

export interface UnsavedPermission {
  roleId: string;
  frontendRegistryId: string;
  canView: boolean;
  canEdit: boolean;
}

// For legacy components that still need table structure
export interface TableInfo {
  name: string;
  fields: string[];
}
