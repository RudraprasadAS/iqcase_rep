
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Layout from "./components/layout/Layout";
import CitizenLayout from "./components/layout/CitizenLayout";
import AuthLayout from "./components/layout/AuthLayout";
import RequireAuth from "./components/auth/RequireAuth";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import CaseDetail from "./pages/CaseDetail";
import NewCase from "./pages/NewCase";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Reports from "./pages/Reports";
import ReportBuilder from "./pages/ReportBuilder";
import StandardReports from "./pages/StandardReports";
import TableReportBuilder from "./pages/TableReportBuilder";
import Insights from "./pages/Insights";
import { ReportBuilder as InsightsReportBuilder } from "./components/insights/ReportBuilder";
import DashboardBuilder from "./pages/DashboardBuilder";
import DashboardView from "./pages/DashboardView";
import Users from "./pages/admin/Users";
import Roles from "./pages/admin/Roles";
import Permissions from "./pages/admin/Permissions";
import KnowledgeBase from "./pages/KnowledgeBase";
import Notifications from "./pages/Notifications";
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import CitizenCases from "./pages/citizen/CitizenCases";
import CitizenCaseDetail from "./pages/citizen/CitizenCaseDetail";
import CitizenNewCase from "./pages/citizen/NewCase";
import CitizenKnowledgeBase from "./pages/citizen/CitizenKnowledgeBase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Citizen portal routes */}
              <Route element={<CitizenLayout />}>
                <Route path="/citizen" element={<CitizenDashboard />} />
                <Route path="/citizen/cases" element={<CitizenCases />} />
                <Route path="/citizen/cases/:id" element={<CitizenCaseDetail />} />
                <Route path="/citizen/new-case" element={<CitizenNewCase />} />
                <Route path="/citizen/knowledge" element={<CitizenKnowledgeBase />} />
              </Route>

              {/* Protected admin routes */}
              <Route element={<RequireAuth />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/cases" element={<Cases />} />
                  <Route path="/cases/:id" element={<CaseDetail />} />
                  <Route path="/new-case" element={<NewCase />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/reports/builder" element={<ReportBuilder />} />
                  <Route path="/reports/standard" element={<StandardReports />} />
                  <Route path="/reports/table-builder" element={<TableReportBuilder />} />
                  <Route path="/insights" element={<Insights />} />
                  <Route path="/insights/report-builder" element={<InsightsReportBuilder />} />
                  <Route path="/insights/dashboard-builder" element={<DashboardBuilder />} />
                  <Route path="/insights/dashboard" element={<DashboardView />} />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/roles" element={<Roles />} />
                  <Route path="/admin/permissions" element={<Permissions />} />
                  <Route path="/knowledge" element={<KnowledgeBase />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Route>
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
