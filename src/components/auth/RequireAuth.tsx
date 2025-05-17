
import { Navigate, Outlet, useLocation } from "react-router-dom";

// This is a placeholder for the real authentication check that will use Supabase
const RequireAuth = () => {
  const location = useLocation();
  // This is a placeholder - will be replaced with actual Supabase auth check
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  if (!isAuthenticated) {
    // Redirect to login page but save the current location to redirect back after login
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
