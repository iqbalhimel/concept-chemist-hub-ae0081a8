import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import iqbalSir from "@/assets/iqbal-sir.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const HeroSection = () => {
  const { t, lang } = useLanguage();
  const { get } = useSiteSettings();

  const isBn = lang === "bn";
  const tagline = get("hero", isBn ? "tagline_bn" : "tagline_en", "") || get("hero", "tagline_en", "") || t.hero.badge;
  const title = get("hero", isBn ? "title_en" : "title_en", ""); // we split title into two parts
  const titleRaw = get("hero", isBn ? "title_bn" : "title_en", "");
  const subtitle = get("hero", isBn ? "subtitle_bn" : "subtitle_en", "") || get("hero", "subtitle_en", "") || t.hero.desc;
  const ctaText = get("hero", isBn ? "cta_text_bn" : "cta_text_en", "") || get("hero", "cta_text_en", "") || t.hero.cta_batch;
  const ctaLink = get("hero", "cta_link", "#contact");
  const heroImage = get("hero", "hero_image", "");

  // Support "Title | Highlight" format for gradient text, fallback to translation
  let titlePart1 = t.hero.title_1;
  let titleHighlight = t.hero.title_highlight;
  if (titleRaw && titleRaw.includes("|")) {
    const parts = titleRaw.split("|");
    titlePart1 = parts[0].trim();
    titleHighlight = parts[1].trim();
  } else if (titleRaw) {
    titlePart1 = titleRaw;
    titleHighlight = "";
  }

  return (
    <section id="home" className="relative min-h-[100dvh] md:min-h-screen flex items-center hero-gradient overflow-hidden w-full max-w-full">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-20 md:pt-20 md:pb-0 relative z-10 mx-auto">
        <div className="flex flex-col-reverse md:flex-row items-center gap-6 md:gap-16 max-w-6xl mx-auto">
          <div className="flex-1 text-center md:text-left">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block px-3 py-1 mb-4 md:mb-6 text-xs sm:text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                {tagline}
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="font-display text-3xl sm:text-4xl md:text-7xl font-extrabold leading-tight mb-4 md:mb-6 tracking-tight hero-title-glow">
              <span className="hero-title-gradient">{titlePart1}</span>{titleHighlight ? " " : ""}{titleHighlight && <span className="hero-title-highlight">{titleHighlight}</span>}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-base md:text-xl text-muted-foreground max-w-2xl mb-6 md:mb-10">
              {subtitle}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4">
              <a href={ctaLink} className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm md:text-base hover:opacity-90 transition-all glow-primary">
                {ctaText} <ArrowRight size={18} />
              </a>
              <a href="#resources" className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-xl border border-border bg-secondary/50 text-foreground font-semibold text-sm md:text-base hover:bg-secondary transition-all">
                <Download size={18} /> {t.hero.cta_notes}
              </a>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex-shrink-0">
            <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-80 md:h-80">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-2xl opacity-60" />
              <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-primary/50 to-accent/40">
                <div className="w-full h-full rounded-full overflow-hidden glass-card border-0 bg-card/40 backdrop-blur-xl">
                  <img src={heroImage || iqbalSir} alt={t.hero.img_alt} className="w-full h-full object-cover object-top" loading="eager" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
