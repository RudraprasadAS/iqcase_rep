
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Main Layout
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
import Insights from '@/pages/Insights';
import { ReportBuilder } from '@/components/insights/ReportBuilder';

// Create a client instance
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <BrowserRouter>
          <Toaster />
          <Routes>
            {/* Protected Admin Routes */}
            <Route element={<RequireAuth />}>
              <Route path="/" element={<Index />} />
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
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
