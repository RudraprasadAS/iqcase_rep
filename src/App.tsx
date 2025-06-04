import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Auth Layout
import AuthLayout from '@/layouts/AuthLayout';
import Login from '@/pages/auth/Login';
import Register from '@/pages/auth/Register';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

// Main Layout
import Layout from '@/layouts/Layout';
import RequireAuth from '@/components/auth/RequireAuth';
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

// Citizen Portal
import CitizenLayout from '@/layouts/CitizenLayout';
import CitizenDashboard from '@/pages/citizen/CitizenDashboard';
import CitizenCases from '@/pages/citizen/CitizenCases';
import CitizenCaseDetail from '@/pages/citizen/CitizenCaseDetail';
import CitizenKnowledgeBase from '@/pages/citizen/CitizenKnowledgeBase';
import Insights from '@/pages/Insights';
import { ReportBuilder } from '@/components/insights/ReportBuilder';

function App() {
  return (
    <QueryClient>
      <HelmetProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            <Route path="/auth/login" element={<AuthLayout><Login /></AuthLayout>} />
            <Route path="/auth/register" element={<AuthLayout><Register /></AuthLayout>} />
            <Route path="/auth/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
            <Route path="/auth/reset-password" element={<AuthLayout><ResetPassword /></AuthLayout>} />
            
            {/* Citizen Portal Routes */}
            <Route path="/citizen" element={<CitizenLayout />}>
              <Route index element={<CitizenDashboard />} />
              <Route path="cases" element={<CitizenCases />} />
              <Route path="cases/new" element={<NewCase />} />
              <Route path="cases/:id" element={<CitizenCaseDetail />} />
              <Route path="knowledge" element={<CitizenKnowledgeBase />} />
            </Route>
            
            {/* Protected Admin Routes */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Index />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="cases" element={<Cases />} />
                <Route path="cases/new" element={<NewCase />} />
                <Route path="cases/:id" element={<CaseDetail />} />
                <Route path="reports" element={<Reports />} />
                <Route path="insights" element={<Insights />} />
                <Route path="report-builder" element={<ReportBuilder />} />
                <Route path="table-report-builder" element={<TableReportBuilder />} />
                <Route path="standard-reports" element={<StandardReports />} />
                <Route path="knowledge" element={<KnowledgeBase />} />
                <Route path="notifications" element={<Notifications />} />
                
                {/* Admin Routes */}
                <Route path="admin/users" element={<Users />} />
                <Route path="admin/roles" element={<Roles />} />
                <Route path="admin/permissions" element={<Permissions />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClient>
  );
}

export default App;
