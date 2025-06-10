
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRoleAccess } from "@/hooks/useRoleAccess";

const RequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { userInfo, isLoading: roleLoading } = useRoleAccess();
  const location = useLocation();

  console.log('RequireAuth - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
  console.log('RequireAuth - userInfo:', userInfo);

  // Show loading state while checking authentication
  if (isLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Role-based routing: redirect citizens to citizen portal, internal users to main app
  if (userInfo) {
    const isCitizen = userInfo.role?.name === 'citizen';
    const isOnCitizenRoute = location.pathname.startsWith('/citizen');
    const isOnInternalRoute = !location.pathname.startsWith('/citizen') && location.pathname !== '/';
    
    console.log('Role-based routing check:', {
      isCitizen,
      isOnCitizenRoute,
      isOnInternalRoute,
      currentPath: location.pathname,
      roleName: userInfo.role?.name
    });

    // Citizens should only access citizen routes
    if (isCitizen && isOnInternalRoute) {
      console.log('Citizen accessing internal route, redirecting to citizen dashboard');
      return <Navigate to="/citizen/dashboard" replace />;
    }

    // Internal users should not access citizen routes
    if (!isCitizen && isOnCitizenRoute) {
      console.log('Internal user accessing citizen route, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('User authenticated, rendering protected content');
  return <Outlet />;
};

export default RequireAuth;
