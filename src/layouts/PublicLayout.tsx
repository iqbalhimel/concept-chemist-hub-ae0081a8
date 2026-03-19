import { Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/PageShell";
import AnnouncementBar from "@/components/AnnouncementBar";
import SeoHead from "@/components/SeoHead";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useWebVitals } from "@/hooks/useWebVitals";

const Footer = lazy(() => import("@/components/Footer"));
const WhatsAppButton = lazy(() => import("@/components/WhatsAppButton"));

export default function PublicLayout() {
  useVisitorTracking();
  useWebVitals();

  return (
    <PageShell>
      <SeoHead />
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <AnnouncementBar />
      <Navbar />
      <Outlet />
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <Suspense fallback={null}>
        <WhatsAppButton />
      </Suspense>
    </PageShell>
  );
}

