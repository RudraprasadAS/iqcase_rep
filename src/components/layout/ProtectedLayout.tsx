
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import RoleBasedRoute from "@/components/auth/RoleBasedRoute";

const ProtectedLayout = () => {
  return (
    <RoleBasedRoute requireAdmin={true} fallbackPath="/citizen/dashboard">
      <SidebarProvider>
        <div className="min-h-screen bg-caseMgmt-background flex w-full font-inter">
          <AppSidebar />
          <SidebarInset>
            <Navbar />
            <main className="flex-1 p-4 md:p-6 overflow-auto font-inter">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </RoleBasedRoute>
  );
};

export default ProtectedLayout;
