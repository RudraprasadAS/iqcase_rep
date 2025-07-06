
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

const Layout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-caseMgmt-background flex w-full">
        <AppSidebar />
        <SidebarInset>
          <Navbar />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
