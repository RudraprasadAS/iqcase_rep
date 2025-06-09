
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FieldPermissionWrapper } from '@/components/auth/FieldPermissionWrapper';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Badge } from '@/components/ui/badge';

export const PermissionDemo: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Permission Demo - User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name:</label>
              <FieldPermissionWrapper 
                moduleName="users" 
                fieldName="name" 
                permissionType="view"
                fallback={<span className="text-gray-400">Hidden</span>}
              >
                <span>John Doe</span>
              </FieldPermissionWrapper>
            </div>
            
            <div>
              <label className="text-sm font-medium">Email:</label>
              <FieldPermissionWrapper 
                moduleName="users" 
                fieldName="email" 
                permissionType="view"
                fallback={<span className="text-gray-400">Hidden</span>}
              >
                <span>john.doe@example.com</span>
              </FieldPermissionWrapper>
            </div>
            
            <div>
              <label className="text-sm font-medium">Role:</label>
              <FieldPermissionWrapper 
                moduleName="users" 
                fieldName="role_id" 
                permissionType="view"
                fallback={<Badge variant="secondary">Hidden</Badge>}
              >
                <Badge>Admin</Badge>
              </FieldPermissionWrapper>
            </div>
            
            <div>
              <label className="text-sm font-medium">Status:</label>
              <FieldPermissionWrapper 
                moduleName="users" 
                fieldName="is_active" 
                permissionType="view"
                fallback={<Badge variant="outline">Hidden</Badge>}
              >
                <Badge variant="default">Active</Badge>
              </FieldPermissionWrapper>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permission Demo - Case Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PermissionGuard 
            moduleName="cases" 
            permissionType="view"
            fallback={<div className="text-red-500">You don't have permission to view cases</div>}
          >
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">Case Title:</label>
                <FieldPermissionWrapper 
                  moduleName="cases" 
                  fieldName="title" 
                  permissionType="view"
                  fallback={<span className="text-gray-400">Hidden</span>}
                >
                  <span>Sample Case Title</span>
                </FieldPermissionWrapper>
              </div>
              
              <div>
                <label className="text-sm font-medium">Case Description:</label>
                <FieldPermissionWrapper 
                  moduleName="cases" 
                  fieldName="description" 
                  permissionType="view"
                  fallback={<span className="text-gray-400">Hidden</span>}
                >
                  <span>This is a sample case description that may be hidden based on permissions.</span>
                </FieldPermissionWrapper>
              </div>
              
              <div>
                <label className="text-sm font-medium">Internal Notes:</label>
                <FieldPermissionWrapper 
                  moduleName="case_notes" 
                  fieldName="note" 
                  permissionType="view"
                  fallback={<span className="text-gray-400">No access to internal notes</span>}
                >
                  <span className="bg-yellow-100 p-2 rounded">This is an internal note only visible to authorized users.</span>
                </FieldPermissionWrapper>
              </div>
            </div>
          </PermissionGuard>
        </CardContent>
      </Card>
    </div>
  );
};
