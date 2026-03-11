import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
const AtmosphereLayer = lazy(() => import("@/components/AtmosphereLayer"));
import SubjectsSection from "@/components/SubjectsSection";
import ApproachSection from "@/components/ApproachSection";
import ExperienceSection from "@/components/ExperienceSection";
import EducationSection from "@/components/EducationSection";
import ResourcesSection from "@/components/ResourcesSection";
import NoticesSection from "@/components/NoticesSection";
import BlogSection from "@/components/BlogSection";
import StatsSection from "@/components/StatsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
import GallerySection from "@/components/GallerySection";
import FAQSection from "@/components/FAQSection";

type Visibility = Record<string, string>;

const Index = () => {
  const [vis, setVis] = useState<Visibility | null>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_sections")
      .maybeSingle()
      .then(({ data }) => {
        setVis((data?.value as Visibility) || {});
      });
  }, []);

  // While loading, show all sections (default visible)
  const show = (key: string) => vis === null || vis[key] !== "false";

  return (
    <main id="main-content" role="main" className="relative">
        <Suspense fallback={null}><AtmosphereLayer /></Suspense>
        {show("show_hero") && <HeroSection />}
        {show("show_about") && <AboutSection />}
        {show("show_subjects") && <SubjectsSection />}
        {show("show_approach") && <ApproachSection />}
        {show("show_stats") && <StatsSection />}
        {show("show_experience") && <ExperienceSection />}
        {show("show_education") && <EducationSection />}
        {show("show_gallery") && <GallerySection />}
        {show("show_testimonials") && <TestimonialsSection />}
        {show("show_notices") && <NoticesSection />}
        {show("show_resources") && <ResourcesSection />}
        {show("show_blog") && <BlogSection />}
        {show("show_faq") && <FAQSection />}
        {show("show_contact") && <ContactSection />}
    </main>
  );
};

export default Index;
