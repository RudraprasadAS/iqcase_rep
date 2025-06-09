
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
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
import { RoleBasedRoute } from "./components/auth/RoleBasedRoute";
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
              
              {/* Protected internal routes - Only for internal users */}
              <Route element={<RequireAuth />}>
                <Route element={
                  <RoleBasedRoute requireInternal={true}>
                    <Layout />
                  </RoleBasedRoute>
                }>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/cases" element={<Cases />} />
                  <Route path="/cases/:id" element={<CaseDetail />} />
                  <Route path="/cases/new" element={<NewCase />} />
                  <Route path="/knowledge" element={<KnowledgeBase />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/insights" element={<Insights />} />
                  
                  {/* Analytics - Only for users with analytics access */}
                  <Route path="/reports" element={
                    <RoleBasedRoute allowedRoles={['admin', 'manager', 'analyst']}>
                      <Reports />
                    </RoleBasedRoute>
                  } />
                  <Route path="/reports/builder" element={
                    <RoleBasedRoute allowedRoles={['admin', 'manager', 'analyst']}>
                      <ReportBuilder />
                    </RoleBasedRoute>
                  } />
                  <Route path="/dashboards" element={
                    <RoleBasedRoute allowedRoles={['admin', 'manager', 'analyst']}>
                      <Dashboards />
                    </RoleBasedRoute>
                  } />
                  
                  {/* Admin routes - Only for admin users */}
                  <Route path="/admin/users" element={
                    <RoleBasedRoute allowedRoles={['admin']}>
                      <Users />
                    </RoleBasedRoute>
                  } />
                  <Route path="/admin/permissions" element={
                    <RoleBasedRoute allowedRoles={['admin']}>
                      <Permissions />
                    </RoleBasedRoute>
                  } />
                  <Route path="/admin/roles" element={
                    <RoleBasedRoute allowedRoles={['admin']}>
                      <Roles />
                    </RoleBasedRoute>
                  } />
                </Route>
                
                {/* Citizen Portal Routes - Only for external users */}
                <Route element={
                  <RoleBasedRoute requireExternal={true}>
                    <CitizenLayout />
                  </RoleBasedRoute>
                }>
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
