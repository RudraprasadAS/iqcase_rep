
import { ModuleRegistry, FrontendModule } from '@/types/moduleRegistry';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Bell, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Users 
} from 'lucide-react';

// Core application modules with their screens and fields
const coreModules: FrontendModule[] = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    category: 'core',
    screens: [
      {
        name: 'overview',
        label: 'Dashboard Overview',
        path: '/dashboard',
        fields: [
          { name: 'total_cases', label: 'Total Cases', type: 'number' },
          { name: 'open_cases', label: 'Open Cases', type: 'number' },
          { name: 'recent_activities', label: 'Recent Activities', type: 'text' },
          { name: 'case_statistics', label: 'Case Statistics', type: 'text' },
          { name: 'priority_breakdown', label: 'Priority Breakdown', type: 'text' }
        ],
        actions: [
          { name: 'view', label: 'View Dashboard', type: 'view' },
          { name: 'export', label: 'Export Data', type: 'export' }
        ]
      }
    ]
  },
  {
    name: 'cases',
    label: 'Cases',
    icon: 'FileText',
    category: 'core',
    screens: [
      {
        name: 'list',
        label: 'Case List',
        path: '/cases',
        fields: [
          { name: 'case_number', label: 'Case Number', type: 'text' },
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'status', label: 'Status', type: 'select' },
          { name: 'priority', label: 'Priority', type: 'select' },
          { name: 'category', label: 'Category', type: 'select' },
          { name: 'created_at', label: 'Created Date', type: 'date' },
          { name: 'assigned_to', label: 'Assigned To', type: 'text' }
        ],
        actions: [
          { name: 'view', label: 'View Cases', type: 'view' },
          { name: 'create', label: 'Create Case', type: 'create' },
          { name: 'edit', label: 'Edit Case', type: 'edit' },
          { name: 'delete', label: 'Delete Case', type: 'delete' },
          { name: 'export', label: 'Export Cases', type: 'export' }
        ]
      },
      {
        name: 'detail',
        label: 'Case Detail',
        path: '/cases/:id',
        fields: [
          { name: 'case_number', label: 'Case Number', type: 'text' },
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'status', label: 'Status', type: 'select' },
          { name: 'priority', label: 'Priority', type: 'select' },
          { name: 'category', label: 'Category', type: 'select' },
          { name: 'location', label: 'Location', type: 'text' },
          { name: 'attachments', label: 'Attachments', type: 'text' },
          { name: 'notes', label: 'Notes', type: 'textarea' },
          { name: 'watchers', label: 'Watchers', type: 'text' },
          { name: 'updates', label: 'Case Updates', type: 'text' },
          { name: 'feedback', label: 'Feedback', type: 'text' }
        ],
        actions: [
          { name: 'view', label: 'View Details', type: 'view' },
          { name: 'edit', label: 'Edit Case', type: 'edit' },
          { name: 'add_note', label: 'Add Note', type: 'custom' },
          { name: 'add_watcher', label: 'Add Watcher', type: 'custom' },
          { name: 'update_status', label: 'Update Status', type: 'custom' }
        ]
      },
      {
        name: 'create',
        label: 'New Case',
        path: '/cases/new',
        fields: [
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: true },
          { name: 'category', label: 'Category', type: 'select' },
          { name: 'priority', label: 'Priority', type: 'select' },
          { name: 'location', label: 'Location', type: 'text' },
          { name: 'attachments', label: 'Attachments', type: 'text' }
        ],
        actions: [
          { name: 'create', label: 'Create Case', type: 'create' }
        ]
      }
    ]
  },
  {
    name: 'knowledge',
    label: 'Knowledge Base',
    icon: 'BookOpen',
    category: 'core',
    screens: [
      {
        name: 'articles',
        label: 'Knowledge Articles',
        path: '/knowledge',
        fields: [
          { name: 'title', label: 'Article Title', type: 'text' },
          { name: 'content', label: 'Content', type: 'textarea' },
          { name: 'category', label: 'Category', type: 'select' },
          { name: 'tags', label: 'Tags', type: 'text' },
          { name: 'created_at', label: 'Created Date', type: 'date' }
        ],
        actions: [
          { name: 'view', label: 'View Articles', type: 'view' },
          { name: 'search', label: 'Search Articles', type: 'custom' }
        ]
      }
    ]
  },
  {
    name: 'notifications',
    label: 'Notifications',
    icon: 'Bell',
    category: 'core',
    screens: [
      {
        name: 'list',
        label: 'Notification Center',
        path: '/notifications',
        fields: [
          { name: 'title', label: 'Title', type: 'text' },
          { name: 'message', label: 'Message', type: 'text' },
          { name: 'type', label: 'Type', type: 'select' },
          { name: 'read_status', label: 'Read Status', type: 'boolean' },
          { name: 'created_at', label: 'Created Date', type: 'date' }
        ],
        actions: [
          { name: 'view', label: 'View Notifications', type: 'view' },
          { name: 'mark_read', label: 'Mark as Read', type: 'custom' }
        ]
      }
    ]
  },
  {
    name: 'insights',
    label: 'Insights',
    icon: 'TrendingUp',
    category: 'core',
    screens: [
      {
        name: 'overview',
        label: 'Insights Overview',
        path: '/insights',
        fields: [
          { name: 'case_trends', label: 'Case Trends', type: 'text' },
          { name: 'performance_metrics', label: 'Performance Metrics', type: 'text' },
          { name: 'category_analysis', label: 'Category Analysis', type: 'text' }
        ],
        actions: [
          { name: 'view', label: 'View Insights', type: 'view' },
          { name: 'export', label: 'Export Reports', type: 'export' }
        ]
      }
    ]
  }
];

const analyticsModules: FrontendModule[] = [
  {
    name: 'reports',
    label: 'Reports',
    icon: 'BarChart3',
    category: 'analytics',
    screens: [
      {
        name: 'list',
        label: 'Reports List',
        path: '/reports',
        fields: [
          { name: 'report_name', label: 'Report Name', type: 'text' },
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'created_at', label: 'Created Date', type: 'date' },
          { name: 'last_run', label: 'Last Run', type: 'date' }
        ],
        actions: [
          { name: 'view', label: 'View Reports', type: 'view' },
          { name: 'run', label: 'Run Report', type: 'custom' },
          { name: 'export', label: 'Export Report', type: 'export' }
        ]
      },
      {
        name: 'builder',
        label: 'Report Builder',
        path: '/reports/builder',
        fields: [
          { name: 'report_name', label: 'Report Name', type: 'text', required: true },
          { name: 'data_source', label: 'Data Source', type: 'select' },
          { name: 'filters', label: 'Filters', type: 'text' },
          { name: 'columns', label: 'Columns', type: 'text' },
          { name: 'chart_type', label: 'Chart Type', type: 'select' }
        ],
        actions: [
          { name: 'create', label: 'Create Report', type: 'create' },
          { name: 'preview', label: 'Preview Report', type: 'view' },
          { name: 'save', label: 'Save Report', type: 'custom' }
        ]
      }
    ]
  },
  {
    name: 'dashboards',
    label: 'Dashboards',
    icon: 'BarChart3',
    category: 'analytics',
    screens: [
      {
        name: 'list',
        label: 'Dashboards List',
        path: '/dashboards',
        fields: [
          { name: 'dashboard_name', label: 'Dashboard Name', type: 'text' },
          { name: 'description', label: 'Description', type: 'text' },
          { name: 'widgets', label: 'Widgets', type: 'text' },
          { name: 'layout', label: 'Layout', type: 'text' }
        ],
        actions: [
          { name: 'view', label: 'View Dashboards', type: 'view' },
          { name: 'create', label: 'Create Dashboard', type: 'create' },
          { name: 'edit', label: 'Edit Dashboard', type: 'edit' },
          { name: 'delete', label: 'Delete Dashboard', type: 'delete' }
        ]
      }
    ]
  }
];

const adminModules: FrontendModule[] = [
  {
    name: 'users',
    label: 'Users',
    icon: 'Users',
    category: 'admin',
    screens: [
      {
        name: 'list',
        label: 'User Management',
        path: '/admin/users',
        fields: [
          { name: 'name', label: 'Full Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'text', required: true },
          { name: 'role', label: 'Role', type: 'select' },
          { name: 'user_type', label: 'User Type', type: 'select' },
          { name: 'status', label: 'Status', type: 'select' },
          { name: 'created_at', label: 'Created Date', type: 'date' },
          { name: 'last_login', label: 'Last Login', type: 'date' }
        ],
        actions: [
          { name: 'view', label: 'View Users', type: 'view' },
          { name: 'create', label: 'Create User', type: 'create' },
          { name: 'edit', label: 'Edit User', type: 'edit' },
          { name: 'delete', label: 'Delete User', type: 'delete' },
          { name: 'reset_password', label: 'Reset Password', type: 'custom' }
        ]
      }
    ]
  },
  {
    name: 'roles',
    label: 'Roles',
    icon: 'Shield',
    category: 'admin',
    screens: [
      {
        name: 'list',
        label: 'Role Management',
        path: '/admin/roles',
        fields: [
          { name: 'name', label: 'Role Name', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'role_type', label: 'Role Type', type: 'select' },
          { name: 'is_system', label: 'System Role', type: 'boolean' },
          { name: 'created_at', label: 'Created Date', type: 'date' }
        ],
        actions: [
          { name: 'view', label: 'View Roles', type: 'view' },
          { name: 'create', label: 'Create Role', type: 'create' },
          { name: 'edit', label: 'Edit Role', type: 'edit' },
          { name: 'delete', label: 'Delete Role', type: 'delete' }
        ]
      }
    ]
  },
  {
    name: 'permissions',
    label: 'Permissions',
    icon: 'Shield',
    category: 'admin',
    screens: [
      {
        name: 'matrix',
        label: 'Permission Matrix',
        path: '/admin/permissions',
        fields: [
          { name: 'role_name', label: 'Role', type: 'select' },
          { name: 'module_name', label: 'Module', type: 'text' },
          { name: 'screen_name', label: 'Screen', type: 'text' },
          { name: 'field_name', label: 'Field', type: 'text' },
          { name: 'can_view', label: 'Can View', type: 'boolean' },
          { name: 'can_edit', label: 'Can Edit', type: 'boolean' }
        ],
        actions: [
          { name: 'view', label: 'View Permissions', type: 'view' },
          { name: 'edit', label: 'Edit Permissions', type: 'edit' },
          { name: 'bulk_update', label: 'Bulk Update', type: 'custom' }
        ]
      }
    ]
  }
];

// Export the complete module registry
export const moduleRegistry: ModuleRegistry = {
  modules: [
    ...coreModules,
    ...analyticsModules,
    ...adminModules
  ]
};

// Helper functions
export const getModuleByName = (name: string) => {
  return moduleRegistry.modules.find(module => module.name === name);
};

export const getScreenByPath = (path: string) => {
  for (const module of moduleRegistry.modules) {
    const screen = module.screens.find(screen => screen.path === path);
    if (screen) {
      return { module, screen };
    }
  }
  return null;
};

export const getAllModulesByCategory = (category: string) => {
  return moduleRegistry.modules.filter(module => module.category === category);
};
