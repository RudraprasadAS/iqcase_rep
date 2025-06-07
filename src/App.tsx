
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import AuthLayout from "@/components/layout/AuthLayout";
import CitizenLayout from "@/components/layout/CitizenLayout";
import RequireAuth from "@/components/auth/RequireAuth";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as UiToaster } from "@/components/ui/toaster";
import "./App.css";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

// Main pages
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import Cases from "@/pages/Cases";
import CaseDetail from "@/pages/CaseDetail";
import NewCase from "@/pages/NewCase";
import Reports from "@/pages/Reports";
import Insights from "@/pages/Insights";
import KnowledgeBase from "@/pages/KnowledgeBase";
import Notifications from "@/pages/Notifications";

// Admin pages
import Users from "@/pages/admin/Users";
import Roles from "@/pages/admin/Roles";
import Permissions from "@/pages/admin/Permissions";

// Citizen pages
import CitizenDashboard from "@/pages/citizen/CitizenDashboard";
import CitizenCases from "@/pages/citizen/CitizenCases";
import CitizenCaseDetail from "@/pages/citizen/CitizenCaseDetail";
import CitizenNewCase from "@/pages/citizen/NewCase";
import CitizenKnowledgeBase from "@/pages/citizen/CitizenKnowledgeBase";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            {/* Public routes */}
            <Route path="/" element={<Index />} />

            {/* Citizen routes */}
            <Route element={<RequireAuth />}>
              <Route element={<CitizenLayout />}>
                <Route path="/citizen" element={<CitizenDashboard />} />
                <Route path="/citizen/cases" element={<CitizenCases />} />
                <Route path="/citizen/cases/:id" element={<CitizenCaseDetail />} />
                <Route path="/citizen/new-case" element={<CitizenNewCase />} />
                <Route path="/citizen/knowledge" element={<CitizenKnowledgeBase />} />
              </Route>
            </Route>

            {/* Protected admin routes */}
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cases" element={<Cases />} />
                <Route path="/cases/:id" element={<CaseDetail />} />
                <Route path="/new-case" element={<NewCase />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/notifications" element={<Notifications />} />
                
                {/* Admin routes */}
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/roles" element={<Roles />} />
                <Route path="/admin/permissions" element={<Permissions />} />
              </Route>
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <UiToaster />
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
