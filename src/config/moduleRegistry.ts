
import { ModuleRegistry } from '@/types/moduleRegistry';

export const moduleRegistry: ModuleRegistry = {
  modules: [
    {
      name: 'dashboard',
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      category: 'core',
      screens: [
        {
          name: 'overview',
          label: 'Overview',
          path: '/dashboard',
          fields: [
            { name: 'total_cases', label: 'Total Cases', type: 'number' },
            { name: 'open_cases', label: 'Open Cases', type: 'number' },
            { name: 'in_progress_cases', label: 'In Progress Cases', type: 'number' },
            { name: 'closed_cases', label: 'Closed Cases', type: 'number' },
            { name: 'overdue_cases', label: 'Overdue Cases', type: 'number' },
            { name: 'recent_activities', label: 'Recent Activities', type: 'text' }
          ],
          actions: [
            { name: 'view', label: 'View Dashboard', type: 'view' },
            { name: 'export', label: 'Export Dashboard', type: 'export' }
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
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'status', label: 'Status', type: 'select', required: true },
            { name: 'priority', label: 'Priority', type: 'select', required: true },
            { name: 'category', label: 'Category', type: 'select' },
            { name: 'assigned_to', label: 'Assigned To', type: 'select' },
            { name: 'submitted_by', label: 'Submitted By', type: 'text' },
            { name: 'created_at', label: 'Created Date', type: 'date' },
            { name: 'updated_at', label: 'Updated Date', type: 'date' },
            { name: 'sla_due_at', label: 'SLA Due Date', type: 'date' },
            { name: 'location', label: 'Location', type: 'text' },
            { name: 'tags', label: 'Tags', type: 'text' }
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
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'status', label: 'Status', type: 'select', required: true },
            { name: 'priority', label: 'Priority', type: 'select', required: true },
            { name: 'category', label: 'Category', type: 'select' },
            { name: 'assigned_to', label: 'Assigned To', type: 'select' },
            { name: 'submitted_by', label: 'Submitted By', type: 'text' },
            { name: 'location', label: 'Location', type: 'text' },
            { name: 'tags', label: 'Tags', type: 'text' },
            { name: 'sla_due_at', label: 'SLA Due Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Case Detail', type: 'view' },
            { name: 'edit', label: 'Edit Case', type: 'edit' },
            { name: 'export', label: 'Export Case', type: 'export' }
          ]
        },
        {
          name: 'messages',
          label: 'Case Messages',
          path: '/cases/:id/messages',
          fields: [
            { name: 'message', label: 'Message', type: 'textarea', required: true },
            { name: 'sender', label: 'Sender', type: 'text' },
            { name: 'is_internal', label: 'Internal Message', type: 'boolean' },
            { name: 'created_at', label: 'Created Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Messages', type: 'view' },
            { name: 'create', label: 'Send Message', type: 'create' },
            { name: 'edit', label: 'Edit Message', type: 'edit' }
          ]
        },
        {
          name: 'tasks',
          label: 'Case Tasks',
          path: '/cases/:id/tasks',
          fields: [
            { name: 'task_name', label: 'Task Name', type: 'text', required: true },
            { name: 'status', label: 'Status', type: 'select', required: true },
            { name: 'assigned_to', label: 'Assigned To', type: 'select' },
            { name: 'due_date', label: 'Due Date', type: 'date' },
            { name: 'created_by', label: 'Created By', type: 'text' },
            { name: 'created_at', label: 'Created Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Tasks', type: 'view' },
            { name: 'create', label: 'Create Task', type: 'create' },
            { name: 'edit', label: 'Edit Task', type: 'edit' },
            { name: 'delete', label: 'Delete Task', type: 'delete' }
          ]
        },
        {
          name: 'notes',
          label: 'Case Notes',
          path: '/cases/:id/notes',
          fields: [
            { name: 'note', label: 'Note', type: 'textarea', required: true },
            { name: 'author', label: 'Author', type: 'text' },
            { name: 'is_internal', label: 'Internal Note', type: 'boolean' },
            { name: 'is_pinned', label: 'Pinned', type: 'boolean' },
            { name: 'created_at', label: 'Created Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Notes', type: 'view' },
            { name: 'create', label: 'Create Note', type: 'create' },
            { name: 'edit', label: 'Edit Note', type: 'edit' },
            { name: 'delete', label: 'Delete Note', type: 'delete' }
          ]
        },
        {
          name: 'attachments',
          label: 'Case Attachments',
          path: '/cases/:id/attachments',
          fields: [
            { name: 'file_name', label: 'File Name', type: 'text' },
            { name: 'file_type', label: 'File Type', type: 'text' },
            { name: 'uploaded_by', label: 'Uploaded By', type: 'text' },
            { name: 'is_private', label: 'Private', type: 'boolean' },
            { name: 'created_at', label: 'Upload Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Attachments', type: 'view' },
            { name: 'create', label: 'Upload Attachment', type: 'create' },
            { name: 'delete', label: 'Delete Attachment', type: 'delete' }
          ]
        },
        {
          name: 'watchers',
          label: 'Case Watchers',
          path: '/cases/:id/watchers',
          fields: [
            { name: 'user', label: 'Watcher', type: 'select' },
            { name: 'added_by', label: 'Added By', type: 'text' },
            { name: 'created_at', label: 'Added Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Watchers', type: 'view' },
            { name: 'create', label: 'Add Watcher', type: 'create' },
            { name: 'delete', label: 'Remove Watcher', type: 'delete' }
          ]
        },
        {
          name: 'feedback',
          label: 'Case Feedback',
          path: '/cases/:id/feedback',
          fields: [
            { name: 'rating', label: 'Rating', type: 'number' },
            { name: 'comment', label: 'Comment', type: 'textarea' },
            { name: 'would_use_again', label: 'Would Use Again', type: 'boolean' },
            { name: 'resolved_satisfaction', label: 'Resolved Satisfaction', type: 'boolean' },
            { name: 'submitted_by', label: 'Submitted By', type: 'text' },
            { name: 'submitted_at', label: 'Submitted Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Feedback', type: 'view' }
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
          label: 'Articles',
          path: '/knowledge',
          fields: [
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'content', label: 'Content', type: 'textarea', required: true },
            { name: 'category', label: 'Category', type: 'select' },
            { name: 'tags', label: 'Tags', type: 'text' },
            { name: 'is_published', label: 'Published', type: 'boolean' },
            { name: 'created_at', label: 'Created Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Articles', type: 'view' },
            { name: 'create', label: 'Create Article', type: 'create' },
            { name: 'edit', label: 'Edit Article', type: 'edit' },
            { name: 'delete', label: 'Delete Article', type: 'delete' }
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
          label: 'Notification List',
          path: '/notifications',
          fields: [
            { name: 'title', label: 'Title', type: 'text' },
            { name: 'message', label: 'Message', type: 'text' },
            { name: 'notification_type', label: 'Type', type: 'select' },
            { name: 'is_read', label: 'Read', type: 'boolean' },
            { name: 'created_at', label: 'Created Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Notifications', type: 'view' },
            { name: 'edit', label: 'Mark as Read', type: 'edit' }
          ]
        }
      ]
    },
    {
      name: 'insights',
      label: 'Insights',
      icon: 'TrendingUp',
      category: 'analytics',
      screens: [
        {
          name: 'overview',
          label: 'Insights Overview',
          path: '/insights',
          fields: [
            { name: 'case_trends', label: 'Case Trends', type: 'text' },
            { name: 'performance_metrics', label: 'Performance Metrics', type: 'text' },
            { name: 'resolution_times', label: 'Resolution Times', type: 'text' },
            { name: 'customer_satisfaction', label: 'Customer Satisfaction', type: 'text' }
          ],
          actions: [
            { name: 'view', label: 'View Insights', type: 'view' },
            { name: 'export', label: 'Export Insights', type: 'export' }
          ]
        }
      ]
    },
    {
      name: 'reports',
      label: 'Reports',
      icon: 'BarChart3',
      category: 'analytics',
      screens: [
        {
          name: 'builder',
          label: 'Report Builder',
          path: '/reports/builder',
          fields: [
            { name: 'report_name', label: 'Report Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'data_source', label: 'Data Source', type: 'select' },
            { name: 'filters', label: 'Filters', type: 'text' },
            { name: 'chart_type', label: 'Chart Type', type: 'select' }
          ],
          actions: [
            { name: 'view', label: 'View Report Builder', type: 'view' },
            { name: 'create', label: 'Create Report', type: 'create' },
            { name: 'edit', label: 'Edit Report', type: 'edit' }
          ]
        },
        {
          name: 'list',
          label: 'Report List',
          path: '/reports',
          fields: [
            { name: 'name', label: 'Report Name', type: 'text' },
            { name: 'description', label: 'Description', type: 'text' },
            { name: 'created_by', label: 'Created By', type: 'text' },
            { name: 'created_at', label: 'Created Date', type: 'date' },
            { name: 'is_public', label: 'Public', type: 'boolean' }
          ],
          actions: [
            { name: 'view', label: 'View Reports', type: 'view' },
            { name: 'create', label: 'Create Report', type: 'create' },
            { name: 'edit', label: 'Edit Report', type: 'edit' },
            { name: 'delete', label: 'Delete Report', type: 'delete' },
            { name: 'export', label: 'Export Report', type: 'export' }
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
          name: 'builder',
          label: 'Dashboard Builder',
          path: '/dashboards/builder',
          fields: [
            { name: 'dashboard_name', label: 'Dashboard Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'layout', label: 'Layout', type: 'text' },
            { name: 'widgets', label: 'Widgets', type: 'text' }
          ],
          actions: [
            { name: 'view', label: 'View Dashboard Builder', type: 'view' },
            { name: 'create', label: 'Create Dashboard', type: 'create' },
            { name: 'edit', label: 'Edit Dashboard', type: 'edit' }
          ]
        },
        {
          name: 'list',
          label: 'Dashboard List',
          path: '/dashboards',
          fields: [
            { name: 'name', label: 'Dashboard Name', type: 'text' },
            { name: 'description', label: 'Description', type: 'text' },
            { name: 'created_by', label: 'Created By', type: 'text' },
            { name: 'created_at', label: 'Created Date', type: 'date' },
            { name: 'is_active', label: 'Active', type: 'boolean' }
          ],
          actions: [
            { name: 'view', label: 'View Dashboards', type: 'view' },
            { name: 'create', label: 'Create Dashboard', type: 'create' },
            { name: 'edit', label: 'Edit Dashboard', type: 'edit' },
            { name: 'delete', label: 'Delete Dashboard', type: 'delete' }
          ]
        }
      ]
    },
    {
      name: 'users',
      label: 'User Management',
      icon: 'Users',
      category: 'admin',
      screens: [
        {
          name: 'list',
          label: 'User List',
          path: '/admin/users',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'email', label: 'Email', type: 'text', required: true },
            { name: 'role', label: 'Role', type: 'select', required: true },
            { name: 'user_type', label: 'User Type', type: 'select' },
            { name: 'is_active', label: 'Active', type: 'boolean' },
            { name: 'last_login', label: 'Last Login', type: 'date' },
            { name: 'created_at', label: 'Created Date', type: 'date' }
          ],
          actions: [
            { name: 'view', label: 'View Users', type: 'view' },
            { name: 'create', label: 'Create User', type: 'create' },
            { name: 'edit', label: 'Edit User', type: 'edit' },
            { name: 'delete', label: 'Delete User', type: 'delete' }
          ]
        }
      ]
    },
    {
      name: 'roles',
      label: 'Role Management',
      icon: 'Shield',
      category: 'admin',
      screens: [
        {
          name: 'list',
          label: 'Role List',
          path: '/admin/roles',
          fields: [
            { name: 'name', label: 'Role Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'role_type', label: 'Role Type', type: 'select' },
            { name: 'is_active', label: 'Active', type: 'boolean' },
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
      label: 'Permission Management',
      icon: 'Shield',
      category: 'admin',
      screens: [
        {
          name: 'matrix',
          label: 'Permission Matrix',
          path: '/admin/permissions',
          fields: [
            { name: 'role', label: 'Role', type: 'select', required: true },
            { name: 'module', label: 'Module', type: 'text' },
            { name: 'screen', label: 'Screen', type: 'text' },
            { name: 'field', label: 'Field', type: 'text' },
            { name: 'can_view', label: 'Can View', type: 'boolean' },
            { name: 'can_edit', label: 'Can Edit', type: 'boolean' }
          ],
          actions: [
            { name: 'view', label: 'View Permissions', type: 'view' },
            { name: 'edit', label: 'Edit Permissions', type: 'edit' }
          ]
        }
      ]
    }
  ]
};
