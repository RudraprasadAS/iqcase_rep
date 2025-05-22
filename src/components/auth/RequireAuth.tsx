
import { Outlet } from "react-router-dom";

// Modified to bypass authentication checks for now
const RequireAuth = () => {
  // Always allow access to protected routes
  return <Outlet />;
};

export default RequireAuth;
