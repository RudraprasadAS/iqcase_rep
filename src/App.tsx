
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { RoleBasedRoute } from '@/components/auth/RoleBasedRoute';
import RequireAuth from '@/components/auth/RequireAuth';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';
import CitizenLayout from '@/components/layout/CitizenLayout';
import Index from '@/pages/Index';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/Dashboard';
import Cases from '@/pages/Cases';
import NewCase from '@/pages/NewCase';
import Insights from '@/pages/Insights';
import Reports from '@/pages/Reports';
import CitizenDashboard from '@/pages/citizen/CitizenDashboard';
import CitizenCases from '@/pages/citizen/CitizenCases';
import CitizenNewCase from '@/pages/citizen/NewCase';
import { HelmetProvider } from 'react-helmet-async';

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/login" element={<Navigate to="/auth/login" replace />} />
              
              {/* Internal user routes */}
              <Route path="/dashboard" element={
                <RequireAuth>
                  <RoleBasedRoute requireInternal>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </RoleBasedRoute>
                </RequireAuth>
              } />
              
              <Route path="/cases" element={
                <RequireAuth>
                  <RoleBasedRoute requireInternal>
                    <Layout>
                      <Cases />
                    </Layout>
                  </RoleBasedRoute>
                </RequireAuth>
              } />
              
              <Route path="/cases/new" element={
                <RequireAuth>
                  <RoleBasedRoute requireInternal>
                    <Layout>
                      <NewCase />
                    </Layout>
                  </RoleBasedRoute>
                </RequireAuth>
              } />

              <Route path="/insights" element={
                <RequireAuth>
                  <RoleBasedRoute requireInternal>
                    <Layout>
                      <Insights />
                    </Layout>
                  </RoleBasedRoute>
                </RequireAuth>
              } />

              <Route path="/reports" element={
                <RequireAuth>
                  <RoleBasedRoute requireInternal>
                    <Layout>
                      <Reports />
                    </Layout>
                  </RoleBasedRoute>
                </RequireAuth>
              } />

              <Route path="/reports/*" element={
                <RequireAuth>
                  <RoleBasedRoute requireInternal>
                    <Layout>
                      <Reports />
                    </Layout>
                  </RoleBasedRoute>
                </RequireAuth>
              } />

              <Route path="/admin/*" element={
                <RequireAuth>
                  <RoleBasedRoute requireAdmin>
                    <Layout>
                      <div className="p-6">
                        <h1 className="text-2xl font-bold">Admin Panel</h1>
                        <p className="text-muted-foreground">Admin functionality coming soon...</p>
                      </div>
                    </Layout>
                  </RoleBasedRoute>
                </RequireAuth>
              } />

              {/* Citizen routes */}
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

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
