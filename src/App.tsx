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
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BlogPostPage from "./pages/BlogPost";
import BlogListing from "./pages/BlogListing";
import TestimonialsPage from "./pages/TestimonialsPage";
import NoticesPage from "./pages/NoticesPage";
import ResourcesPage from "./pages/ResourcesPage";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <>
    <HreflangTags />
    <LanguageRedirect />
    <Routes>
      {/* Lang-prefixed public routes */}
      <Route path="/:lang" element={<Index />} />
      <Route path="/:lang/blog" element={<BlogListing />} />
      <Route path="/:lang/blog/:id" element={<BlogPostPage />} />
      <Route path="/:lang/testimonials" element={<TestimonialsPage />} />
      <Route path="/:lang/notices" element={<NoticesPage />} />
      <Route path="/:lang/resources" element={<ResourcesPage />} />

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

      {/* Legacy routes (redirect via LanguageRedirect) */}
      <Route path="/" element={<Index />} />
      <Route path="/blog" element={<BlogListing />} />
      <Route path="/blog/:id" element={<BlogPostPage />} />
      <Route path="/testimonials" element={<TestimonialsPage />} />
      <Route path="/notices" element={<NoticesPage />} />
      <Route path="/resources" element={<ResourcesPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrightnessProvider>
        <AuthProvider>
          <ThemeLoader />
          <BrowserRouter>
            <LanguageProvider>
              <AppRoutes />
            </LanguageProvider>
          </BrowserRouter>
        </AuthProvider>
      </BrightnessProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
