
import { Outlet } from "react-router-dom";
import { Card } from "@/components/ui/card";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-caseMgmt-background flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-caseMgmt-primary">Case Management System</h1>
          <p className="text-caseMgmt-neutral mt-2">Modern, flexible case management solution</p>
        </div>
        
        <Card className="w-full shadow-lg border-caseMgmt-border animate-fade-in">
          <Outlet />
        </Card>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>© 2025 Case Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
