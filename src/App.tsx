
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import NewCase from "./pages/NewCase";
import Reports from "./pages/Reports";
import ReportBuilder from "./pages/ReportBuilder";
import TableReportBuilder from "./pages/TableReportBuilder";
import StandardReports from "./pages/StandardReports";
import Dashboards from "./pages/Dashboards";
import KnowledgeBase from "./pages/KnowledgeBase";
import Insights from "./pages/Insights";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminUsers from "./pages/admin/Users";
import AdminPermissions from "./pages/admin/Permissions";
import AdminRoles from "./pages/admin/Roles";

// Citizen pages
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import CitizenCases from "./pages/citizen/CitizenCases";
import CitizenCaseDetail from "./pages/citizen/CitizenCaseDetail";
import CitizenNewCase from "./pages/citizen/NewCase";
import CitizenKnowledgeBase from "./pages/citizen/CitizenKnowledgeBase";

import Layout from "./components/layout/Layout";
import CitizenLayout from "./components/layout/CitizenLayout";
import AuthLayout from "./components/layout/AuthLayout";
import { RequireAuth, RoleBasedRoute } from "./components/auth";
import { initializeFrontendRegistry } from "./utils/initializeFrontendRegistry";

const queryClient = new QueryClient();

const App = () => {
  // Initialize frontend registry on app start
  useEffect(() => {
    const initRegistry = async () => {
      try {
        await initializeFrontendRegistry();
        console.log("✅ Frontend registry initialized successfully");
      } catch (error) {
        console.error("❌ Failed to initialize frontend registry:", error);
      }
    };
    
    initRegistry();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <SidebarProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Auth routes */}
                <Route path="/auth/login" element={<AuthLayout><Login /></AuthLayout>} />
                <Route path="/auth/register" element={<AuthLayout><Register /></AuthLayout>} />
                <Route path="/auth/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
                <Route path="/auth/reset-password" element={<AuthLayout><ResetPassword /></AuthLayout>} />
                
                {/* Citizen routes */}
                <Route path="/citizen" element={<RequireAuth><CitizenLayout><CitizenDashboard /></CitizenLayout></RequireAuth>} />
                <Route path="/citizen/cases" element={<RequireAuth><CitizenLayout><CitizenCases /></CitizenLayout></RequireAuth>} />
                <Route path="/citizen/cases/new" element={<RequireAuth><CitizenLayout><CitizenNewCase /></CitizenLayout></RequireAuth>} />
                <Route path="/citizen/cases/:id" element={<RequireAuth><CitizenLayout><CitizenCaseDetail /></CitizenLayout></RequireAuth>} />
                <Route path="/citizen/knowledge" element={<RequireAuth><CitizenLayout><CitizenKnowledgeBase /></CitizenLayout></RequireAuth>} />
                
                {/* Internal routes */}
                <Route path="/" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_worker"]}><Layout><Index /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/dashboard" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_worker"]}><Layout><Dashboard /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/cases" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_worker"]}><Layout><Cases /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/cases/new" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_worker"]}><Layout><NewCase /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/cases/:id" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_worker"]}><Layout><CaseDetail /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/reports" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_writer"]}><Layout><Reports /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/reports/builder" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager"]}><Layout><ReportBuilder /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/reports/table-builder" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager"]}><Layout><TableReportBuilder /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/reports/standard" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_worker"]}><Layout><StandardReports /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/dashboards" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager"]}><Layout><Dashboards /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/knowledge" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_worker"]}><Layout><KnowledgeBase /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/insights" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_worker"]}><Layout><Insights /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/notifications" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin", "manager", "caseworker", "case_worker"]}><Layout><Notifications /></Layout></RoleBasedRoute></RequireAuth>} />
                
                {/* Admin routes */}
                <Route path="/admin/users" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin"]}><Layout><AdminUsers /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/admin/permissions" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin"]}><Layout><AdminPermissions /></Layout></RoleBasedRoute></RequireAuth>} />
                <Route path="/admin/roles" element={<RequireAuth><RoleBasedRoute allowedRoles={["admin"]}><Layout><AdminRoles /></Layout></RoleBasedRoute></RequireAuth>} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </SidebarProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
