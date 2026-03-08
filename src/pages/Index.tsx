import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SubjectsSection from "@/components/SubjectsSection";
import ApproachSection from "@/components/ApproachSection";
import ExperienceSection from "@/components/ExperienceSection";
import EducationSection from "@/components/EducationSection";
import ResourcesSection from "@/components/ResourcesSection";
import NoticesSection from "@/components/NoticesSection";
import BlogSection from "@/components/BlogSection";
import StatsSection from "@/components/StatsSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import GallerySection from "@/components/GallerySection";
import FAQSection from "@/components/FAQSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <SubjectsSection />
      <ApproachSection />
      <StatsSection />
      <GallerySection />
      <ExperienceSection />
      <EducationSection />
      <ResourcesSection />
      <BlogSection />
      <FAQSection />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
