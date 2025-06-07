
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import NewCase from "./pages/NewCase";
import KnowledgeBase from "./pages/KnowledgeBase";
import Notifications from "./pages/Notifications";
import Insights from "./pages/Insights";
import Reports from "./pages/Reports";
import ReportBuilder from "./pages/reports/ReportBuilder";
import TableBuilder from "./pages/reports/TableBuilder";
import Users from "./pages/admin/Users";
import Permissions from "./pages/admin/Permissions";
import Roles from "./pages/admin/Roles";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import CitizenCases from "./pages/citizen/CitizenCases";
import CitizenCaseDetail from "./pages/citizen/CitizenCaseDetail";
import CitizenNewCase from "./pages/citizen/NewCase";
import CitizenKnowledgeBase from "./pages/citizen/CitizenKnowledgeBase";
import Layout from "./components/layout/Layout";
import AuthLayout from "./components/layout/AuthLayout";
import CitizenLayout from "./components/layout/CitizenLayout";
import RequireAuth from "./components/auth/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            
            {/* Auth routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>

            {/* Citizen portal routes */}
            <Route path="/citizen" element={<RequireAuth><CitizenLayout /></RequireAuth>}>
              <Route index element={<Navigate to="/citizen/dashboard" replace />} />
              <Route path="dashboard" element={<CitizenDashboard />} />
              <Route path="cases" element={<CitizenCases />} />
              <Route path="cases/new" element={<CitizenNewCase />} />
              <Route path="cases/:id" element={<CitizenCaseDetail />} />
              <Route path="knowledge" element={<CitizenKnowledgeBase />} />
            </Route>

            {/* Protected admin routes */}
            <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="cases" element={<Cases />} />
              <Route path="cases/new" element={<NewCase />} />
              <Route path="cases/:id" element={<CaseDetail />} />
              <Route path="knowledge" element={<KnowledgeBase />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="insights" element={<Insights />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/builder" element={<ReportBuilder />} />
              <Route path="reports/table-builder" element={<TableBuilder />} />
              <Route path="admin/users" element={<Users />} />
              <Route path="admin/permissions" element={<Permissions />} />
              <Route path="admin/roles" element={<Roles />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
