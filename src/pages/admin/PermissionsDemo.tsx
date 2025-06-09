
import React from 'react';
import { FrontendPermissionGuard } from '@/components/auth/FrontendPermissionGuard';
import { FieldPermissionDemo } from '@/components/permissions/FieldPermissionDemo';

const PermissionsDemoPage = () => {
  return (
    <FrontendPermissionGuard elementKey="permission_matrix">
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Permissions Demo</h1>
          <p className="text-muted-foreground">
            This page demonstrates how field-level permissions work in practice
          </p>
        </div>
        
        <FieldPermissionDemo />
      </div>
    </FrontendPermissionGuard>
  );
};

export default PermissionsDemoPage;
