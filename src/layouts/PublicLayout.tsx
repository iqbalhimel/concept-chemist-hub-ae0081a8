import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/PageShell";
import WhatsAppButton from "@/components/WhatsAppButton";
import AnnouncementBar from "@/components/AnnouncementBar";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

export default function PublicLayout() {
  useVisitorTracking();

  return (
    <PageShell>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <AnnouncementBar />
      <Navbar />
      <Outlet />
      <Footer />
      <WhatsAppButton />
    </PageShell>
  );
}

