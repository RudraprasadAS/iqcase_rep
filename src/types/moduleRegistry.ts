
export interface ModuleField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
  required?: boolean;
}

export interface ModuleAction {
  name: string;
  label: string;
  type: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'custom';
}

export interface ModuleScreen {
  name: string;
  label: string;
  path: string;
  fields: ModuleField[];
  actions: ModuleAction[];
}

export interface FrontendModule {
  name: string;
  label: string;
  icon: string;
  category: 'core' | 'admin' | 'analytics' | 'citizen';
  screens: ModuleScreen[];
}

export interface ModuleRegistry {
  modules: FrontendModule[];
}
