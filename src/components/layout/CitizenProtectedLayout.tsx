
import { Outlet } from "react-router-dom";
import CitizenNavbar from "./CitizenNavbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import CitizenSidebar from "./CitizenSidebar";
import RoleBasedRoute from "@/components/auth/RoleBasedRoute";

const CitizenProtectedLayout = () => {
  return (
    <RoleBasedRoute requireCitizen={true} fallbackPath="/dashboard">
      <SidebarProvider>
        <div className="min-h-screen bg-caseMgmt-background flex w-full font-inter">
          <CitizenSidebar />
          <SidebarInset>
            <CitizenNavbar />
            <main className="flex-1 p-4 md:p-6 overflow-auto font-inter">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </RoleBasedRoute>
  );
};

export default CitizenProtectedLayout;
