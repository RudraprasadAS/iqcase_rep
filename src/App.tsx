
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { RoleBasedRoute } from '@/components/auth/RoleBasedRoute';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/layout/Layout';
import CitizenLayout from '@/components/layout/CitizenLayout';
import Index from '@/pages/Index';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/Dashboard';
import Cases from '@/pages/Cases';
import NewCase from '@/pages/NewCase';
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
              <Route path="/login" element={<Login />} />
              
              {/* Internal user routes - Admins can access everything */}
              <Route path="/dashboard" element={
                <RoleBasedRoute requireInternal>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </RoleBasedRoute>
              } />
              
              <Route path="/cases" element={
                <RoleBasedRoute requireInternal>
                  <Layout>
                    <Cases />
                  </Layout>
                </RoleBasedRoute>
              } />
              
              <Route path="/cases/new" element={
                <RoleBasedRoute requireInternal>
                  <Layout>
                    <NewCase />
                  </Layout>
                </RoleBasedRoute>
              } />

              {/* Citizen routes */}
              <Route path="/citizen/dashboard" element={
                <RoleBasedRoute requireExternal>
                  <CitizenLayout>
                    <CitizenDashboard />
                  </CitizenLayout>
                </RoleBasedRoute>
              } />
              
              <Route path="/citizen/cases" element={
                <RoleBasedRoute requireExternal>
                  <CitizenLayout>
                    <CitizenCases />
                  </CitizenLayout>
                </RoleBasedRoute>
              } />
              
              <Route path="/citizen/cases/new" element={
                <RoleBasedRoute requireExternal>
                  <CitizenLayout>
                    <CitizenNewCase />
                  </CitizenLayout>
                </RoleBasedRoute>
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
