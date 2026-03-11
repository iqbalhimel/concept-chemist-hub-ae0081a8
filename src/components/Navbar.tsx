import { useMemo, useState, useEffect } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBrightness } from "@/contexts/BrightnessContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#home");
  const { mode, toggle } = useBrightness();
  const { lang, t, switchLang } = useLanguage();
  const { get } = useSiteSettings();

  const siteName = get("site_info", "site_name", "Iqbal Sir");

  const navLinks = useMemo(() => [
    { label: t.nav.home, href: "#home" },
    { label: t.nav.about, href: "#about" },
    { label: t.nav.subjects, href: "#subjects" },
    { label: t.nav.experience, href: "#experience" },
    { label: t.nav.education, href: "#education" },
    { label: t.nav.resources, href: "#resources" },
    { label: t.nav.blog, href: "#blog" },
    { label: t.nav.contact, href: "#contact" },
  ], [t.nav.about, t.nav.blog, t.nav.contact, t.nav.education, t.nav.experience, t.nav.home, t.nav.resources, t.nav.subjects]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let raf = 0;
    const ids = navLinks.map((l) => l.href.replace("#", ""));
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY + 120;
        let current = navLinks[0]?.href ?? "#home";
        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top + window.scrollY;
          if (top <= y) current = `#${id}`;
        }
        setActiveHref(current);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [navLinks]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="px-3 sm:px-4 pt-3">
        <div
          className={`mx-auto max-w-6xl transition-all duration-300 ${
            scrolled
              ? "bg-background/65 backdrop-blur-2xl border border-border shadow-lg"
              : "bg-transparent"
          } rounded-2xl`}
        >
          <div className="w-full flex items-center justify-between h-14 md:h-16 px-3 sm:px-5">
            <a href="#home" className="font-display text-lg md:text-xl font-bold gradient-text tracking-tight">
              {siteName}
            </a>

            {/* Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = activeHref === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 text-sm rounded-xl transition-all ${
                      active
                        ? "text-foreground bg-secondary/60"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="relative">
                      {link.label}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute left-1/2 -bottom-2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_6px_hsl(var(--primary)/0.18)]"
                        />
                      )}
                    </span>
                  </a>
                );
              })}

              <div className="mx-2 h-6 w-px bg-border/70" aria-hidden />

              <button
                onClick={switchLang}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                aria-label="Switch language"
              >
                {lang === "en" ? "বাংলা" : "EN"}
              </button>
              <button
                onClick={toggle}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>

            {/* Mobile controls */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={switchLang}
                className="px-3 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors min-h-[44px] flex items-center"
              >
                {lang === "en" ? "বাংলা" : "EN"}
              </button>
              <button
                onClick={toggle}
                className="p-2.5 rounded-xl text-foreground hover:bg-secondary/40 transition-colors min-h-[44px] flex items-center justify-center"
              >
                {mode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2.5 rounded-xl text-foreground hover:bg-secondary/40 transition-colors min-h-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden"
              >
                <div className="px-3 pb-3">
                  <div className="glass-card p-2">
                    <div className="flex flex-col">
                      {navLinks.map((link) => {
                        const active = activeHref === link.href;
                        return (
                          <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileOpen(false)}
                            className={`px-4 py-3 rounded-xl transition-colors ${
                              active
                                ? "bg-secondary/60 text-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                            }`}
                            aria-current={active ? "page" : undefined}
                          >
                            {link.label}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
