
import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useBulkPermissionCheck } from '@/hooks/usePermissionCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const PermissionDebugger: React.FC = () => {
  const { userInfo, isLoading: roleLoading } = useRoleAccess();

  // Check ALL possible modules that could have permissions
  const allPossibleModules = [
    'dashboard', 'cases', 'users', 'roles', 'permissions', 'locations', 'case_categories',
    'case_messages', 'case_notes', 'case_attachments', 'case_activities',
    'case_tasks', 'case_watchers', 'case_feedback', 'notifications',
    'report_templates', 'report_configs', 'dashboard_templates', 
    'dashboard_layouts', 'data_sources', 'insights', 'analytics',
    'reports', 'dashboards', 'admin', 'knowledge', 'related_cases',
    'case_categories', 'case_sla_policies', 'category_sla_matrix'
  ];

  const modulePermissions = allPossibleModules.flatMap(module => [
    { moduleName: module, permissionType: 'view' as const },
    { moduleName: module, permissionType: 'edit' as const }
  ]);

  const { permissionResults, isLoading: permissionLoading } = useBulkPermissionCheck(modulePermissions);

  if (roleLoading || permissionLoading) {
    return <div>Loading...</div>;
  }

  // Group permissions by module
  const moduleGroups = allPossibleModules.reduce((acc, module) => {
    const canView = permissionResults[`${module}.view`] || false;
    const canEdit = permissionResults[`${module}.edit`] || false;
    
    if (canView || canEdit) {
      acc[module] = { canView, canEdit };
    }
    
    return acc;
  }, {} as Record<string, { canView: boolean; canEdit: boolean }>);

  const totalPermissions = Object.keys(moduleGroups).length;
  const viewPermissions = Object.values(moduleGroups).filter(p => p.canView).length;
  const editPermissions = Object.values(moduleGroups).filter(p => p.canEdit).length;

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Permission Debugger</CardTitle>
        <div className="flex gap-2 text-sm">
          <Badge variant="outline">Total Modules: {totalPermissions}</Badge>
          <Badge variant="default">View: {viewPermissions}</Badge>
          <Badge variant="secondary">Edit: {editPermissions}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">User Info:</h3>
          <div className="text-sm bg-gray-100 p-3 rounded mt-2">
            <div><strong>Email:</strong> {userInfo?.id}</div>
            <div><strong>Role:</strong> {userInfo?.role?.name} ({userInfo?.role?.role_type})</div>
            <div><strong>User Type:</strong> {userInfo?.user_type}</div>
            <div><strong>System Role:</strong> {userInfo?.role?.is_system ? 'Yes' : 'No'}</div>
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold">Module Permissions:</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {Object.entries(moduleGroups)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([module, permissions]) => (
                <div key={module} className="border rounded p-2 text-sm">
                  <div className="font-medium text-xs uppercase tracking-wide text-gray-600 mb-1">
                    {module.replace(/_/g, ' ')}
                  </div>
                  <div className="flex gap-1">
                    {permissions.canView && (
                      <Badge variant="default" className="text-xs">View</Badge>
                    )}
                    {permissions.canEdit && (
                      <Badge variant="secondary" className="text-xs">Edit</Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
          
          {totalPermissions === 0 && (
            <div className="text-center py-8 text-gray-500 border rounded">
              No permissions found for this user
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 border-t pt-3">
          <p><strong>Note:</strong> This shows all modules where the user has at least view or edit permissions.</p>
          <p>If you're Super Admin and see limited permissions, check the permissions matrix in the admin panel.</p>
        </div>
      </CardContent>
    </Card>
  );
};
