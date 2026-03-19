import { lazy, Suspense } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import ErrorBoundary from "@/components/ErrorBoundary";

// Critical above-fold sections — eagerly bundled
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import SubjectsSection from "@/components/SubjectsSection";
import ApproachSection from "@/components/ApproachSection";

// Below-fold sections — lazy-loaded so they don't block initial parse/paint
const AtmosphereLayer = lazy(() => import("@/components/AtmosphereLayer"));
const StatsSection = lazy(() => import("@/components/StatsSection"));
const ExperienceSection = lazy(() => import("@/components/ExperienceSection"));
const ProfessionalTrainingSection = lazy(() => import("@/components/ProfessionalTrainingSection"));
const EducationSection = lazy(() => import("@/components/EducationSection"));
const GallerySection = lazy(() => import("@/components/GallerySection"));
const VideoSection = lazy(() => import("@/components/VideoSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const NoticesSection = lazy(() => import("@/components/NoticesSection"));
const ResourcesSection = lazy(() => import("@/components/ResourcesSection"));
const BlogSection = lazy(() => import("@/components/BlogSection"));
const RecommendedSection = lazy(() => import("@/components/RecommendedSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));

const Index = () => {
  const { settings, loaded } = useSiteSettings();
  const vis = settings["homepage_sections"] as Record<string, string> | undefined;

  // While loading (not yet fetched), show all sections (default visible)
  const show = (key: string) => !loaded || vis?.[key] !== "false";

  return (
    <main id="main-content" role="main" className="relative">
      <ErrorBoundary>
        <Suspense fallback={<div aria-hidden className="fixed inset-0 -z-10 bg-background" />}>
          <AtmosphereLayer />
        </Suspense>
      </ErrorBoundary>

      {/* Critical above-fold — eagerly rendered */}
      {show("show_hero") && <HeroSection />}
      {show("show_about") && <AboutSection />}
      {show("show_subjects") && <SubjectsSection />}
      {show("show_approach") && <ApproachSection />}

      {/* Below-fold — each section is a separate lazy chunk */}
      <ErrorBoundary
        fallback={
          <div className="py-16 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" aria-label="Loading" />
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="py-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" aria-label="Loading" />
            </div>
          }
        >
          {show("show_stats") && <StatsSection />}
          {show("show_experience") && <ExperienceSection />}
          {show("show_training") && <ProfessionalTrainingSection />}
          {show("show_education") && <EducationSection />}
          {show("show_gallery") && <GallerySection />}
          {show("show_videos") && <VideoSection />}
          {show("show_testimonials") && <TestimonialsSection />}
          {show("show_notices") && <NoticesSection />}
          {show("show_resources") && <ResourcesSection />}
          {show("show_blog") && <BlogSection />}
          {show("show_recommended") && <RecommendedSection />}
          {show("show_faq") && <FAQSection />}
          {show("show_contact") && <ContactSection />}
        </Suspense>
      </ErrorBoundary>
    </main>
  );
};

export default Index;
