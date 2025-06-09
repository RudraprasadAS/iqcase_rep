
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth';
import { RoleBasedRoute } from '@/components/auth/RoleBasedRoute';
import RequireAuth from '@/components/auth/RequireAuth';
import Layout from '@/components/layout/Layout';
import AuthLayout from '@/components/layout/AuthLayout';
import CitizenLayout from '@/components/layout/CitizenLayout';

// Auth pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

// Main pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Cases from '@/pages/Cases';
import CaseDetail from '@/pages/CaseDetail';
import NewCase from '@/pages/NewCase';
import Notifications from '@/pages/Notifications';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Reports from '@/pages/Reports';
import ReportBuilder from '@/pages/ReportBuilder';
import TableReportBuilder from '@/pages/TableReportBuilder';
import StandardReports from '@/pages/StandardReports';
import Insights from '@/pages/Insights';
import Dashboards from '@/pages/Dashboards';

// Admin pages
import Users from '@/pages/admin/Users';
import Roles from '@/pages/admin/Roles';
import Permissions from '@/pages/admin/Permissions';

// Citizen pages
import CitizenDashboard from '@/pages/citizen/CitizenDashboard';
import CitizenCases from '@/pages/citizen/CitizenCases';
import CitizenCaseDetail from '@/pages/citizen/CitizenCaseDetail';
import CitizenNewCase from '@/pages/citizen/NewCase';
import CitizenKnowledgeBase from '@/pages/citizen/CitizenKnowledgeBase';

import NotFound from '@/pages/NotFound';

import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Helmet>
                <title>Case Management System</title>
                <meta name="description" content="Comprehensive case management and customer service platform" />
              </Helmet>
              
              <Routes>
                {/* Public route */}
                <Route path="/" element={<Index />} />
                
                {/* Auth routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* Citizen routes */}
                <Route path="/citizen" element={
                  <RequireAuth>
                    <RoleBasedRoute requireExternal={true}>
                      <CitizenLayout>
                        <Outlet />
                      </CitizenLayout>
                    </RoleBasedRoute>
                  </RequireAuth>
                }>
                  <Route path="dashboard" element={<CitizenDashboard />} />
                  <Route path="cases" element={<CitizenCases />} />
                  <Route path="cases/new" element={<CitizenNewCase />} />
                  <Route path="cases/:id" element={<CitizenCaseDetail />} />
                  <Route path="knowledge" element={<CitizenKnowledgeBase />} />
                </Route>

                {/* Internal staff routes */}
                <Route path="/" element={
                  <RequireAuth>
                    <RoleBasedRoute requireInternal={true}>
                      <Layout>
                        <Outlet />
                      </Layout>
                    </RoleBasedRoute>
                  </RequireAuth>
                }>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="cases" element={<Cases />} />
                  <Route path="cases/new" element={<NewCase />} />
                  <Route path="cases/:id" element={<CaseDetail />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="knowledge" element={<KnowledgeBase />} />
                  
                  {/* Reports section */}
                  <Route path="reports" element={<Reports />} />
                  <Route path="reports/builder" element={<ReportBuilder />} />
                  <Route path="reports/table-builder" element={<TableReportBuilder />} />
                  <Route path="reports/standard" element={<StandardReports />} />
                  
                  {/* Move dashboards under reports */}
                  <Route path="reports/dashboards" element={<Dashboards />} />
                  
                  <Route path="insights" element={<Insights />} />
                  
                  {/* Admin routes */}
                  <Route path="admin/users" element={
                    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                      <Users />
                    </RoleBasedRoute>
                  } />
                  <Route path="admin/roles" element={
                    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                      <Roles />
                    </RoleBasedRoute>
                  } />
                  <Route path="admin/permissions" element={
                    <RoleBasedRoute allowedRoles={['admin', 'super_admin']}>
                      <Permissions />
                    </RoleBasedRoute>
                  } />
                </Route>

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
