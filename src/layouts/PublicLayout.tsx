import { Outlet } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/PageShell";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function PublicLayout() {
  return (
    <PageShell>
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>
      <Navbar />
      <Outlet />
      <Footer />
      <WhatsAppButton />
    </PageShell>
  );
}

