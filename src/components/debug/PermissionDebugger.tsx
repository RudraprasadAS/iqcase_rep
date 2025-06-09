
import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useMenuPermissions, useUserPermissions } from '@/hooks/usePermissionCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PermissionDebugger: React.FC = () => {
  const { userInfo, isLoading: roleLoading } = useRoleAccess();
  const { userPermissions, isLoading: permissionLoading } = useUserPermissions();
  const {
    canViewAnalytics,
    canViewReports,
    canViewAdmin,
    canViewUsers,
    canViewPermissions,
    canViewRoles,
    canViewDashboards,
    canViewInsights,
    canViewCases,
    canViewNotifications,
    canViewKnowledge,
    availableModules
  } = useMenuPermissions();

  if (roleLoading || permissionLoading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Permission Debugger - Super Admin Check</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">User Info:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(userInfo, null, 2)}
          </pre>
        </div>
        
        <div>
          <h3 className="font-semibold">Available Modules (from permissions):</h3>
          <div className="text-sm space-y-1">
            {availableModules.map(module => (
              <div key={module} className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  {module}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold">Menu Permissions:</h3>
          <ul className="text-sm space-y-1">
            <li>Analytics: {canViewAnalytics ? '✅' : '❌'}</li>
            <li>Reports: {canViewReports ? '✅' : '❌'}</li>
            <li>Admin: {canViewAdmin ? '✅' : '❌'}</li>
            <li>Users: {canViewUsers ? '✅' : '❌'}</li>
            <li>Permissions: {canViewPermissions ? '✅' : '❌'}</li>
            <li>Roles: {canViewRoles ? '✅' : '❌'}</li>
            <li>Dashboards: {canViewDashboards ? '✅' : '❌'}</li>
            <li>Insights: {canViewInsights ? '✅' : '❌'}</li>
            <li>Cases: {canViewCases ? '✅' : '❌'}</li>
            <li>Notifications: {canViewNotifications ? '✅' : '❌'}</li>
            <li>Knowledge Base: {canViewKnowledge ? '✅' : '❌'}</li>
          </ul>
        </div>

        <div>
          <h3 className="font-semibold">All User Permissions (Raw):</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded max-h-64 overflow-y-auto">
            {JSON.stringify(userPermissions, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};
