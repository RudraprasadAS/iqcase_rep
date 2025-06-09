
import React from 'react';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useMenuPermissions } from '@/hooks/usePermissionCheck';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PermissionDebugger: React.FC = () => {
  const { userInfo, isLoading: roleLoading } = useRoleAccess();
  const {
    canViewAnalytics,
    canViewReports,
    canViewAdmin,
    canViewUsers,
    canViewPermissions,
    canViewRoles,
    canViewDashboards,
    canViewInsights,
    isLoading: permissionLoading
  } = useMenuPermissions();

  if (roleLoading || permissionLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Permission Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold">User Info:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded">
            {JSON.stringify(userInfo, null, 2)}
          </pre>
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
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
