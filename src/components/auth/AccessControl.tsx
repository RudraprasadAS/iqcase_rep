
import React from 'react';
import { useAccessCheck } from '@/hooks/usePermissionCheck';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AccessControlProps {
  module: string;
  screen?: string;
  element_key?: string;
  type: 'can_view' | 'can_edit';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAsDisabled?: boolean;
}

// Main access control wrapper component
export const AccessControl: React.FC<AccessControlProps> = ({
  module,
  screen,
  element_key,
  type,
  children,
  fallback = null,
  showAsDisabled = false
}) => {
  const { hasAccess, isLoading } = useAccessCheck();

  // Show loading state
  if (isLoading) {
    return <div className="opacity-50">{children}</div>;
  }

  // Check access
  const hasPermission = hasAccess({ module, screen, element_key, type });

  if (!hasPermission) {
    // If edit permission is denied but we want to show as disabled
    if (type === 'can_edit' && showAsDisabled) {
      // Check if user has view permission
      const hasViewPermission = hasAccess({ module, screen, element_key, type: 'can_view' });
      if (hasViewPermission) {
        return (
          <div className="opacity-60 pointer-events-none">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  disabled: true,
                  className: `${child.props.className || ''} cursor-not-allowed`
                });
              }
              return child;
            })}
          </div>
        );
      }
    }
    
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Page-level access control component
interface PageAccessControlProps {
  module: string;
  screen?: string;
  children: React.ReactNode;
}

export const PageAccessControl: React.FC<PageAccessControlProps> = ({
  module,
  screen,
  children
}) => {
  const { hasAccess, isLoading, userInfo } = useAccessCheck();
  const navigate = useNavigate();

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading permissions...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check page access
  const hasPageAccess = hasAccess({ module, screen, type: 'can_view' });

  if (!hasPageAccess) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldX className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Current role: {userInfo?.role_name || 'Unknown'} | Module: {module}
            </p>
            <Button onClick={() => navigate('/dashboard')} className="mr-2">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

// Button-specific access control
interface ButtonAccessControlProps {
  module: string;
  element_key: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ButtonAccessControl: React.FC<ButtonAccessControlProps> = ({
  module,
  element_key,
  children,
  fallback = null
}) => {
  return (
    <AccessControl
      module={module}
      element_key={element_key}
      type="can_edit"
      fallback={fallback}
    >
      {children}
    </AccessControl>
  );
};

// Field-specific access control
interface FieldAccessControlProps {
  module: string;
  element_key: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAsReadOnly?: boolean;
}

export const FieldAccessControl: React.FC<FieldAccessControlProps> = ({
  module,
  element_key,
  children,
  fallback = null,
  showAsReadOnly = true
}) => {
  return (
    <AccessControl
      module={module}
      element_key={element_key}
      type="can_edit"
      fallback={fallback}
      showAsDisabled={showAsReadOnly}
    >
      {children}
    </AccessControl>
  );
};
