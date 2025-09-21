
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PWAStatus from "@/components/PWAStatus";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SupportSelection from "./pages/SupportSelection";
import ConsultantAvailability from "./pages/ConsultantAvailability";
import AdminDashboard from "./pages/AdminDashboard";
import { MessagingPage } from "./pages/Messaging";
import MessagingProtectedRoute from "@/components/MessagingProtectedRoute";
import NotFound from "./pages/NotFound";
import "@/lib/pwa"; // Initialize PWA functionality

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute>
                <SupportSelection />
              </ProtectedRoute>
            } />
            <Route path="/consultant/availability" element={
              <ProtectedRoute>
                <ConsultantAvailability />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <MessagingProtectedRoute>
                  <MessagingPage />
                </MessagingProtectedRoute>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <PWAStatus />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);export default App;
