
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layouts
import Layout from '@/components/layout/Layout';
import AuthLayout from '@/components/layout/AuthLayout';
import CitizenLayout from '@/components/layout/CitizenLayout';
import RequireAuth from '@/components/auth/RequireAuth';

// Pages
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Cases from '@/pages/Cases';
import CaseDetail from '@/pages/CaseDetail';
import Reports from '@/pages/Reports';
import TableReportBuilder from '@/pages/TableReportBuilder';
import StandardReports from '@/pages/StandardReports';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Notifications from '@/pages/Notifications';
import Users from '@/pages/admin/Users';
import Roles from '@/pages/admin/Roles';
import Permissions from '@/pages/admin/Permissions';
import NewCase from '@/pages/NewCase';
import Insights from '@/pages/Insights';
import { ReportBuilder } from '@/components/insights/ReportBuilder';

// Auth Pages
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

// Citizen Pages
import CitizenDashboard from '@/pages/citizen/CitizenDashboard';
import CitizenCases from '@/pages/citizen/CitizenCases';
import CitizenCaseDetail from '@/pages/citizen/CitizenCaseDetail';
import CitizenKnowledgeBase from '@/pages/citizen/CitizenKnowledgeBase';
import CitizenNewCase from '@/pages/citizen/NewCase';

// Create a client instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Protected Staff Routes */}
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/cases/new" element={<NewCase />} />
                <Route path="/cases/:id" element={<CaseDetail />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/report-builder" element={<ReportBuilder />} />
                <Route path="/table-report-builder" element={<TableReportBuilder />} />
                <Route path="/standard-reports" element={<StandardReports />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/notifications" element={<Notifications />} />
                
                {/* Admin Routes */}
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/roles" element={<Roles />} />
                <Route path="/admin/permissions" element={<Permissions />} />
              </Route>
            </Route>

            {/* Citizen Portal Routes */}
            <Route element={<RequireAuth />}>
              <Route element={<CitizenLayout />}>
                <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
                <Route path="/citizen/cases" element={<CitizenCases />} />
                <Route path="/citizen/cases/new" element={<CitizenNewCase />} />
                <Route path="/citizen/cases/:id" element={<CitizenCaseDetail />} />
                <Route path="/citizen/knowledge" element={<CitizenKnowledgeBase />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
