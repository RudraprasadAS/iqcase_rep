
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { initializeFrontendRegistry } from "@/utils/initializeFrontendRegistry";
import { ProtectedRoute } from "@/components/auth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Layout from "./components/layout/Layout";
import CitizenLayout from "./components/layout/CitizenLayout";
import AuthLayout from "./components/layout/AuthLayout";
import RequireAuth from "./components/auth/RequireAuth";
import Permissions from "./pages/admin/Permissions";
import Users from "./pages/admin/Users";
import Reports from "./pages/Reports";
import ReportBuilder from "./pages/ReportBuilder";
import Dashboards from "./pages/Dashboards";
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import NewCase from './pages/NewCase';
import KnowledgeBase from './pages/KnowledgeBase';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import CitizenCases from './pages/citizen/CitizenCases';
import CitizenCaseDetail from './pages/citizen/CitizenCaseDetail';
import NewCitizenCase from './pages/citizen/NewCase';
import CitizenKnowledgeBase from './pages/citizen/CitizenKnowledgeBase';
import Notifications from './pages/Notifications';
import Insights from './pages/Insights';
import Roles from './pages/admin/Roles';

const queryClient = new QueryClient();
const helmetContext = {};

function App() {
  useEffect(() => {
    // Initialize frontend registry on app load
    const initializeRegistry = async () => {
      try {
        await initializeFrontendRegistry();
      } catch (error) {
        console.error("Failed to initialize frontend registry:", error);
      }
    };

    initializeRegistry();
  }, []);

  return (
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Main login page */}
              <Route path="/" element={<Index />} />
              
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/reset-password" element={<ResetPassword />} />
              </Route>
              
              {/* Protected internal routes */}
              <Route element={<RequireAuth />}>
                <Route element={<Layout />}>
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute module="dashboard">
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/cases" 
                    element={
                      <ProtectedRoute module="cases">
                        <Cases />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/cases/:id" 
                    element={
                      <ProtectedRoute module="cases" screen="case_detail">
                        <CaseDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/cases/new" 
                    element={
                      <ProtectedRoute module="cases" screen="new_case">
                        <NewCase />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/knowledge" 
                    element={
                      <ProtectedRoute module="knowledge">
                        <KnowledgeBase />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/notifications" 
                    element={
                      <ProtectedRoute module="notifications">
                        <Notifications />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/insights" 
                    element={
                      <ProtectedRoute module="insights">
                        <Insights />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Analytics - Separate routes for different user types */}
                  <Route 
                    path="/analytics/reports" 
                    element={
                      <ProtectedRoute module="reports">
                        <Reports />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/analytics/builder" 
                    element={
                      <ProtectedRoute module="reports" screen="report_builder">
                        <ReportBuilder />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/analytics/dashboards" 
                    element={
                      <ProtectedRoute module="dashboards">
                        <Dashboards />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Legacy routes for backward compatibility */}
                  <Route 
                    path="/reports" 
                    element={
                      <ProtectedRoute module="reports">
                        <Reports />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/reports/builder" 
                    element={
                      <ProtectedRoute module="reports" screen="report_builder">
                        <ReportBuilder />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/dashboards" 
                    element={
                      <ProtectedRoute module="dashboards">
                        <Dashboards />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Admin */}
                  <Route 
                    path="/admin/users" 
                    element={
                      <ProtectedRoute module="users_management">
                        <Users />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/permissions" 
                    element={
                      <ProtectedRoute module="permissions_management">
                        <Permissions />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/admin/roles" 
                    element={
                      <ProtectedRoute module="roles_management">
                        <Roles />
                      </ProtectedRoute>
                    } 
                  />
                </Route>
                
                {/* Citizen Portal Routes */}
                <Route element={<CitizenLayout />}>
                  <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                  <Route path="/citizen/cases" element={<CitizenCases />} />
                  <Route path="/citizen/cases/:id" element={<CitizenCaseDetail />} />
                  <Route path="/citizen/cases/new" element={<NewCitizenCase />} />
                  <Route path="/citizen/knowledge" element={<CitizenKnowledgeBase />} />
                  <Route path="/citizen/notifications" element={<Notifications />} />
                </Route>
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
