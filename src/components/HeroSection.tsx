import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Download } from "lucide-react";
import iqbalSirPng from "@/assets/iqbal-sir.png";
import iqbalSirWebp from "@/assets/iqbal-sir.webp";
import { useMemo, lazy, Suspense, memo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const ScienceHeroCanvas = lazy(() => import("./ScienceHeroCanvas"));

const HeroSection = () => {
  const { t, lang } = useLanguage();
  const { get, loaded: settingsLoaded } = useSiteSettings();

  const isBn = lang === "bn";
  const tagline = get("hero", isBn ? "tagline_bn" : "tagline_en", "") || get("hero", "tagline_en", "") || t.hero.badge;
  const titleRaw = get("hero", isBn ? "title_bn" : "title_en", "");
  const subtitle = get("hero", isBn ? "subtitle_bn" : "subtitle_en", "") || get("hero", "subtitle_en", "") || t.hero.desc;
  const ctaText = get("hero", isBn ? "cta_text_bn" : "cta_text_en", "") || get("hero", "cta_text_en", "") || t.hero.cta_batch;
  const ctaLink = get("hero", "cta_link", "#contact");
  const heroImage = get("hero", "hero_image", "");
  const heroAnimationEnabled = settingsLoaded && get("hero_animation", "enabled", "") === "true";

  const parseNumberSetting = (value: string | undefined) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const heroAnimationConfig = useMemo(() => {
    if (!settingsLoaded || !heroAnimationEnabled) {
      return {
        minSpacing: undefined,
        repulsionForce: undefined,
        minSpeed: undefined,
        maxSpeed: undefined,
      };
    }
    return {
      minSpacing: parseNumberSetting(get("hero_animation", "min_spacing", "")),
      repulsionForce: parseNumberSetting(get("hero_animation", "repulsion_force", "")),
      minSpeed: parseNumberSetting(get("hero_animation", "min_speed", "")),
      maxSpeed: parseNumberSetting(get("hero_animation", "max_speed", "")),
    };
  }, [get, heroAnimationEnabled, settingsLoaded]);

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
    <section
      id="home"
      className="section-shell relative min-h-[100dvh] md:min-h-screen flex items-center hero-gradient overflow-hidden w-full max-w-full"
    >
      {/* Science animation canvas - z-index 1 */}
      {heroAnimationEnabled && settingsLoaded && (
        <Suspense fallback={null}>
          <ScienceHeroCanvas
            minSpacing={heroAnimationConfig.minSpacing}
            repulsionForce={heroAnimationConfig.repulsionForce}
            minSpeed={heroAnimationConfig.minSpeed}
            maxSpeed={heroAnimationConfig.maxSpeed}
          />
        </Suspense>
      )}

      <div aria-hidden className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-grid" />
      </div>
      <div aria-hidden className="absolute -top-24 -left-24 w-72 h-72 bg-primary/12 rounded-full blur-3xl animate-pulse-glow" />
      <div
        aria-hidden
        className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] bg-accent/10 rounded-full blur-3xl animate-pulse-glow"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 pt-28 md:pt-32 pb-16 md:pb-20 relative z-10 mx-auto">
        <div className="flex flex-col-reverse md:flex-row items-center gap-10 md:gap-16 max-w-6xl mx-auto">
          <div className="flex-1 text-center md:text-left">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="badge-soft mb-5 md:mb-7 text-primary border border-primary/20">
                {tagline}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.05] mb-5 md:mb-7 tracking-tight hero-title-glow"
            >
              <span className="hero-title-gradient">{titlePart1}</span>{titleHighlight ? " " : ""}{titleHighlight && <span className="hero-title-highlight">{titleHighlight}</span>}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-xl text-muted-foreground max-w-2xl mb-7 md:mb-10"
            >
              {subtitle}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4">
              <a
                href={ctaLink}
                className="btn-shine inline-flex items-center gap-2 px-6 py-3.5 md:px-8 md:py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm md:text-base hover:opacity-90 transition-all glow-primary"
              >
                {ctaText} <ArrowRight size={18} />
              </a>
              <a
                href="#resources"
                className="inline-flex items-center gap-2 px-6 py-3.5 md:px-8 md:py-4 rounded-xl border border-border bg-secondary/40 text-foreground font-semibold text-sm md:text-base hover:bg-secondary/60 transition-colors"
              >
                <Download size={18} /> {t.hero.cta_notes}
              </a>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="flex-shrink-0">
            <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-80 md:h-80">
              <div aria-hidden className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/45 to-accent/35 blur-2xl opacity-70" />
              <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-primary/55 to-accent/45">
                <div className="w-full h-full rounded-full overflow-hidden glass-card border-0 bg-card/35 backdrop-blur-2xl">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt={t.hero.img_alt}
                      className="w-full h-full object-cover object-top"
                      loading="eager"
                      fetchPriority="high"
                      decoding="sync"
                    />
                  ) : (
                    <picture>
                      <source srcSet={iqbalSirWebp} type="image/webp" />
                      <img
                        src={iqbalSirPng}
                        alt={t.hero.img_alt}
                        className="w-full h-full object-cover object-top"
                        loading="eager"
                        fetchPriority="high"
                        decoding="sync"
                      />
                    </picture>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.a
          href="#about"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-12 md:mt-16 w-fit mx-auto flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Scroll to about"
        >
          <span>Scroll</span>
          <ChevronDown size={16} className="animate-bounce" />
        </motion.a>
      </div>
    </section>
  );
};

export default memo(HeroSection);
