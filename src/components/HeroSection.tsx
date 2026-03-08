import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import iqbalSir from "@/assets/iqbal-sir.png";

const HeroSection = () => {
  return (
    <section id="home" className="relative min-h-[100dvh] md:min-h-screen flex items-center hero-gradient overflow-hidden w-full max-w-full">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />

      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-20 md:pt-20 md:pb-0 relative z-10 mx-auto">
        <div className="flex flex-col-reverse md:flex-row items-center gap-6 md:gap-16 max-w-6xl mx-auto">
          {/* Text */}
          <div className="flex-1 text-center md:text-left">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block px-3 py-1 mb-4 md:mb-6 text-xs sm:text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                Science Educator · Kishoreganj, Bangladesh
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-3xl sm:text-4xl md:text-7xl font-bold leading-tight mb-4 md:mb-6"
            >
              Learn Science the{" "}
              <span className="gradient-text">Smart Way</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base md:text-xl text-muted-foreground max-w-2xl mb-6 md:mb-10"
            >
              Concept-based learning for SSC and HSC students with multimedia teaching.
              Making science easy, engaging, and accessible.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4"
            >
              <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm md:text-base hover:opacity-90 transition-all glow-primary">
                Join a Batch <ArrowRight size={18} />
              </a>
              <a href="#resources" className="inline-flex items-center gap-2 px-6 py-3 md:px-8 md:py-4 rounded-xl border border-border bg-secondary/50 text-foreground font-semibold text-sm md:text-base hover:bg-secondary transition-all">
                <Download size={18} /> Download Free Notes
              </a>
            </motion.div>
          </div>

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-shrink-0"
          >
            <div className="relative w-40 h-40 sm:w-56 sm:h-56 md:w-80 md:h-80">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 blur-2xl opacity-60" />
              {/* Glass border */}
              <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-br from-primary/50 to-accent/40">
                <div className="w-full h-full rounded-full overflow-hidden glass-card border-0 bg-card/40 backdrop-blur-xl">
                  <img
                    src={iqbalSir}
                    alt="MD. Iqbal Husen – Science Educator"
                    className="w-full h-full object-cover object-top"
                    loading="eager"
                  />
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
