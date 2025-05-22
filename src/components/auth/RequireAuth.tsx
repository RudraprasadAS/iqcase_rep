
import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const RequireAuth = () => {
  const { isAuthenticated, user, superAdminLogin } = useAuth();
  const location = useLocation();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Authentication Required</h1>
          <p className="mb-6 text-center">
            You need to be logged in to access this page.
          </p>
          <div className="space-y-4">
            <Button 
              className="w-full"
              onClick={() => superAdminLogin()}
            >
              Login as Super Admin
            </Button>
            <div className="text-center">
              <Navigate to="/auth/login" state={{ from: location }} replace />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default RequireAuth;
