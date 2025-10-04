
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SupportSelection from "./pages/SupportSelection";
import ConsultantAvailability from "./pages/ConsultantAvailability";
import ConsultantSkills from "./pages/ConsultantSkills";
import AdminDashboard from "./pages/AdminDashboard";
import { MessagingPage } from "./pages/Messaging";
import MessagingProtectedRoute from "@/components/MessagingProtectedRoute";
import NotFound from "./pages/NotFound";
import Tickets from "./pages/Tickets";
import AuthCallback from "./pages/AuthCallback";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import AdminUsers from "./pages/admin/Users";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminSettings from "./pages/admin/AdminSettings";
import SupportTaxonomyAdmin from "./pages/admin/SupportTaxonomy";
import AdminSSOSettings from "./pages/AdminSSOSettings";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationRefundPolicy from "./pages/CancellationRefundPolicy";
import ShippingDeliveryPolicy from "./pages/ShippingDeliveryPolicy";
import TermsConditions from "./pages/TermsConditions";
import ConfirmEmail from "./pages/ConfirmEmail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cancellation-refund-policy" element={<CancellationRefundPolicy />} />
            <Route path="/shipping-delivery-policy" element={<ShippingDeliveryPolicy />} />
            <Route path="/terms-conditions" element={<TermsConditions />} />
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
            <Route path="/tickets" element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/help" element={
              <ProtectedRoute>
                <Help />
              </ProtectedRoute>
            } />
            <Route path="/consultant/availability" element={
              <ProtectedRoute>
                <ConsultantAvailability />
              </ProtectedRoute>
            } />
            <Route path="/consultant/skills" element={
              <ProtectedRoute>
                <ConsultantSkills />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/taxonomy" element={
              <ProtectedRoute>
                <SupportTaxonomyAdmin />
              </ProtectedRoute>
            } />
            <Route path="/admin/sso-settings" element={
              <ProtectedRoute>
                <AdminSSOSettings />
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
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
);export default App;
