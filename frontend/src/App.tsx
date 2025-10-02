
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import MessagingProtectedRoute from "@/components/MessagingProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SupportSelection = lazy(() => import("./pages/SupportSelection"));
const ConsultantAvailability = lazy(() => import("./pages/ConsultantAvailability"));
const ConsultantSkills = lazy(() => import("./pages/ConsultantSkills"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const MessagingPage = lazy(() => import("./pages/Messaging").then(module => ({ default: module.MessagingPage })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Tickets = lazy(() => import("./pages/Tickets"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Settings = lazy(() => import("./pages/Settings"));
const Help = lazy(() => import("./pages/Help"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const SupportTaxonomyAdmin = lazy(() => import("./pages/admin/SupportTaxonomy"));
const AdminSSOSettings = lazy(() => import("./pages/AdminSSOSettings"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const CancellationRefundPolicy = lazy(() => import("./pages/CancellationRefundPolicy"));
const ShippingDeliveryPolicy = lazy(() => import("./pages/ShippingDeliveryPolicy"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Error boundary for individual routes
const RouteErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('401')) return false;
        if (error instanceof Error && error.message.includes('403')) return false;
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false,
      refetchIntervalInBackground: false,
      enabled: true,
      notifyOnChangeProps: ['data', 'error', 'isLoading'],
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
            <Route path="/" element={<RouteErrorBoundary><Index /></RouteErrorBoundary>} />
            <Route path="/login" element={<RouteErrorBoundary><Login /></RouteErrorBoundary>} />
            <Route path="/auth/callback" element={<RouteErrorBoundary><AuthCallback /></RouteErrorBoundary>} />
            <Route path="/contact-us" element={<RouteErrorBoundary><ContactUs /></RouteErrorBoundary>} />
            <Route path="/privacy-policy" element={<RouteErrorBoundary><PrivacyPolicy /></RouteErrorBoundary>} />
            <Route path="/cancellation-refund-policy" element={<RouteErrorBoundary><CancellationRefundPolicy /></RouteErrorBoundary>} />
            <Route path="/shipping-delivery-policy" element={<RouteErrorBoundary><ShippingDeliveryPolicy /></RouteErrorBoundary>} />
            <Route path="/terms-conditions" element={<RouteErrorBoundary><TermsConditions /></RouteErrorBoundary>} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <RouteErrorBoundary><Dashboard /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/support" element={
              <ProtectedRoute>
                <RouteErrorBoundary><SupportSelection /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/tickets" element={
              <ProtectedRoute>
                <RouteErrorBoundary><Tickets /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <RouteErrorBoundary><Settings /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/help" element={
              <ProtectedRoute>
                <RouteErrorBoundary><Help /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/consultant/availability" element={
              <ProtectedRoute>
                <RouteErrorBoundary><ConsultantAvailability /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/consultant/skills" element={
              <ProtectedRoute>
                <RouteErrorBoundary><ConsultantSkills /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <RouteErrorBoundary><AdminDashboard /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <RouteErrorBoundary><AdminUsers /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute>
                <RouteErrorBoundary><AdminAnalytics /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <RouteErrorBoundary><AdminSettings /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/taxonomy" element={
              <ProtectedRoute>
                <RouteErrorBoundary><SupportTaxonomyAdmin /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/admin/sso-settings" element={
              <ProtectedRoute>
                <RouteErrorBoundary><AdminSSOSettings /></RouteErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <MessagingProtectedRoute>
                  <RouteErrorBoundary><MessagingPage /></RouteErrorBoundary>
                </MessagingProtectedRoute>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<RouteErrorBoundary><NotFound /></RouteErrorBoundary>} />
          </Routes>
            </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);export default App;
