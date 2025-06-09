import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import NewCase from "./pages/NewCase";
import Users from "./pages/admin/Users";
import Roles from "./pages/admin/Roles";
import Permissions from "./pages/admin/Permissions";
import Reports from "./pages/Reports";
import ReportBuilder from "./pages/ReportBuilder";
import TableReportBuilder from "./pages/TableReportBuilder";
import StandardReports from "./pages/StandardReports";
import Insights from "./pages/Insights";
import KnowledgeBase from "./pages/KnowledgeBase";
import Notifications from "./pages/Notifications";
import Dashboards from "./pages/Dashboards";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import CitizenCases from "./pages/citizen/CitizenCases";
import CitizenCaseDetail from "./pages/citizen/CitizenCaseDetail";
import CitizenNewCase from "./pages/citizen/NewCase";
import CitizenKnowledgeBase from "./pages/citizen/CitizenKnowledgeBase";
import Layout from "./components/layout/Layout";
import CitizenLayout from "./components/layout/CitizenLayout";
import AuthLayout from "./components/layout/AuthLayout";
import RequireAuth from "./components/auth/RequireAuth";
import { RoleBasedRoute } from "./components/auth/RoleBasedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>

            {/* Public Landing Page */}
            <Route path="/landing" element={<Index />} />

            {/* Redirect root to appropriate dashboard */}
            <Route path="/" element={
              <RequireAuth>
                <Navigate to="/dashboard" replace />
              </RequireAuth>
            } />

            {/* Internal User Routes */}
            <Route path="/dashboard" element={
              <RequireAuth>
                <Layout>
                  <Dashboard />
                </Layout>
              </RequireAuth>
            } />

            <Route path="/cases" element={
              <RequireAuth>
                <Layout>
                  <Cases />
                </Layout>
              </RequireAuth>
            } />

            <Route path="/cases/new" element={
              <RequireAuth>
                <Layout>
                  <NewCase />
                </Layout>
              </RequireAuth>
            } />

            <Route path="/cases/:id" element={
              <RequireAuth>
                <Layout>
                  <CaseDetail />
                </Layout>
              </RequireAuth>
            } />

            {/* Admin Routes */}
            <Route path="/admin/users" element={
              <RequireAuth>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Users />
                  </Layout>
                </RoleBasedRoute>
              </RequireAuth>
            } />

            <Route path="/admin/roles" element={
              <RequireAuth>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Roles />
                  </Layout>
                </RoleBasedRoute>
              </RequireAuth>
            } />

            <Route path="/admin/permissions" element={
              <RequireAuth>
                <RoleBasedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Permissions />
                  </Layout>
                </RoleBasedRoute>
              </RequireAuth>
            } />

            {/* Reports Routes */}
            <Route path="/reports" element={
              <RequireAuth>
                <Layout>
                  <Reports />
                </Layout>
              </RequireAuth>
            } />

            <Route path="/reports/builder" element={
              <RequireAuth>
                <Layout>
                  <ReportBuilder />
                </Layout>
              </RequireAuth>
            } />

            <Route path="/reports/table-builder" element={
              <RequireAuth>
                <Layout>
                  <TableReportBuilder />
                </Layout>
              </RequireAuth>
            } />

            <Route path="/reports/standard" element={
              <RequireAuth>
                <Layout>
                  <StandardReports />
                </Layout>
              </RequireAuth>
            } />

            {/* Other Internal Routes */}
            <Route path="/insights" element={
              <RequireAuth>
                <Layout>
                  <Insights />
                </Layout>
              </RequireAuth>
            } />

            <Route path="/knowledge" element={
              <RequireAuth>
                <Layout>
                  <KnowledgeBase />
                </Layout>
              </RequireAuth>
            } />

            <Route path="/notifications" element={
              <RequireAuth>
                <Layout>
                  <Notifications />
                </Layout>
              </RequireAuth>
            } />

            <Route path="/dashboards" element={
              <RequireAuth>
                <Layout>
                  <Dashboards />
                </Layout>
              </RequireAuth>
            } />

            {/* Citizen Routes */}
            <Route path="/citizen/dashboard" element={
              <RequireAuth>
                <RoleBasedRoute requireExternal>
                  <CitizenLayout>
                    <CitizenDashboard />
                  </CitizenLayout>
                </RoleBasedRoute>
              </RequireAuth>
            } />

            <Route path="/citizen/cases" element={
              <RequireAuth>
                <RoleBasedRoute requireExternal>
                  <CitizenLayout>
                    <CitizenCases />
                  </CitizenLayout>
                </RoleBasedRoute>
              </RequireAuth>
            } />

            <Route path="/citizen/cases/new" element={
              <RequireAuth>
                <RoleBasedRoute requireExternal>
                  <CitizenLayout>
                    <CitizenNewCase />
                  </CitizenLayout>
                </RoleBasedRoute>
              </RequireAuth>
            } />

            <Route path="/citizen/cases/:id" element={
              <RequireAuth>
                <RoleBasedRoute requireExternal>
                  <CitizenLayout>
                    <CitizenCaseDetail />
                  </CitizenLayout>
                </RoleBasedRoute>
              </RequireAuth>
            } />

            <Route path="/citizen/knowledge" element={
              <RequireAuth>
                <RoleBasedRoute requireExternal>
                  <CitizenLayout>
                    <CitizenKnowledgeBase />
                  </CitizenLayout>
                </RoleBasedRoute>
              </RequireAuth>
            } />

            {/* 404 Page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
