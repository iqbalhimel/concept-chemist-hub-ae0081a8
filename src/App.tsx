import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrightnessProvider } from "@/contexts/BrightnessContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ThemeLoader from "@/components/ThemeLoader";
import HreflangTags from "@/components/HreflangTags";
import LanguageRedirect from "@/components/LanguageRedirect";
import { lazy, Suspense } from "react";
import PublicLayout from "@/layouts/PublicLayout";
import PerformanceApplier from "@/components/PerformanceApplier";

// Eagerly loaded (homepage critical path)
import Index from "./pages/Index";

// Lazy loaded (secondary pages)
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const BlogPostPage = lazy(() => import("./pages/BlogPost"));
const BlogListing = lazy(() => import("./pages/BlogListing"));
const TestimonialsPage = lazy(() => import("./pages/TestimonialsPage"));
const NoticesPage = lazy(() => import("./pages/NoticesPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      gcTime: 1000 * 60 * 10, // 10 min (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const AppRoutes = () => (
  <>
    <HreflangTags />
    <LanguageRedirect />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes (Navbar/Footer rendered once in layout) */}
        <Route element={<PublicLayout />}>
          {/* Lang-prefixed */}
          <Route path="/:lang" element={<Index />} />
          <Route path="/:lang/blog" element={<BlogListing />} />
          <Route path="/:lang/blog/:id" element={<BlogPostPage />} />
          <Route path="/:lang/testimonials" element={<TestimonialsPage />} />
          <Route path="/:lang/notices" element={<NoticesPage />} />
          <Route path="/:lang/resources" element={<ResourcesPage />} />

          {/* Legacy routes (redirect handled via LanguageRedirect) */}
          <Route path="/" element={<Index />} />
          <Route path="/blog" element={<BlogListing />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/notices" element={<NoticesPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
        </Route>

        {/* Admin routes (no lang prefix) */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
);

const AtmosphereDebugBadge = lazy(() => import("@/components/AtmosphereDebugBadge"));

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrightnessProvider>
        <AuthProvider>
          <ThemeLoader />
          <PerformanceApplier />
          <BrowserRouter>
            <LanguageProvider>
              <AppRoutes />
            </LanguageProvider>
          </BrowserRouter>
          <Suspense fallback={null}>
            <AtmosphereDebugBadge />
          </Suspense>
        </AuthProvider>
      </BrightnessProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
