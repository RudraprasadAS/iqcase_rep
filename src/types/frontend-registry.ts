
export interface FrontendRegistryItem {
  id: string;
  module: string;
  screen: string;
  element_type: 'field' | 'button' | 'tab' | 'section' | 'menu' | 'action';
  element_key: string;
  label?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegistryPermission {
  id: string;
  role_id: string;
  frontend_registry_id: string;
  can_view: boolean;
  can_edit: boolean;
  created_at: string;
  updated_at: string;
  frontend_registry?: FrontendRegistryItem;
}
