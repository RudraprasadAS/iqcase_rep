
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

const RequireAuth = () => {
  const { isAuthenticated, user, login } = useAuth();
  const location = useLocation();
  const [isDevBypass, setIsDevBypass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to login as super admin
  const loginAsSuperAdmin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Using a predefined admin email
      await login("admin@example.com", "adminpassword");
      setIsDevBypass(true);
    } catch (err: any) {
      console.error("Admin login error:", err);
      setError(err.message || "Failed to login as admin");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to login if not authenticated and not using dev bypass
  if (!isAuthenticated && !isDevBypass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-caseMgmt-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-caseMgmt-primary">Authentication Required</h2>
              <p className="text-caseMgmt-neutral mt-2">
                You need to be authenticated to access this page.
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <Button
                onClick={() => loginAsSuperAdmin()}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login as Super Admin"}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Or go to{" "}
                  <Navigate to="/auth/login" state={{ from: location }} replace />
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <Outlet />;
};

export default RequireAuth;
