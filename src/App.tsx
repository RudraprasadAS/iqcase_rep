
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Layouts
import Layout from '@/components/layout/Layout';
import AuthLayout from '@/components/layout/AuthLayout';
import RequireAuth from '@/components/auth/RequireAuth';

// Pages
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Cases from '@/pages/Cases';
import Insights from '@/pages/Insights';
import KnowledgeBase from '@/pages/KnowledgeBase';
import Notifications from '@/pages/Notifications';

// Auth Pages
import Login from '@/pages/auth/Login';

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
            </Route>

            {/* Protected Routes */}
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/notifications" element={<Notifications />} />
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
