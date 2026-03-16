import { useMemo, useState, useEffect, useRef } from "react";
import { Menu, X, Moon, Sun, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBrightness } from "@/contexts/BrightnessContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type NavItem = { label: string; href: string };

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeHref, setActiveHref] = useState("#home");
  const moreRef = useRef<HTMLDivElement>(null);
  const { mode, toggle } = useBrightness();
  const { lang, t, switchLang } = useLanguage();
  const { get } = useSiteSettings();

  const siteName = get("site_info", "site_name", "Iqbal Sir");

  const primaryLinks: NavItem[] = useMemo(() => [
    { label: t.nav.home, href: "#home" },
    { label: t.nav.about, href: "#about" },
    { label: t.nav.subjects, href: "#subjects" },
    { label: t.nav.experience, href: "#experience" },
    { label: t.nav.education, href: "#education" },
    { label: t.nav.blog, href: "#blog" },
    { label: t.nav.contact, href: "#contact" },
  ], [t.nav]);

  const moreLinks: NavItem[] = useMemo(() => [
    { label: t.nav.approach, href: "#approach" },
    { label: t.nav.achievements, href: "#student-success" },
    { label: t.nav.training, href: "#professional-training" },
    { label: t.nav.gallery, href: "#gallery" },
    { label: t.nav.videos, href: "#videos" },
    { label: t.nav.testimonials, href: "#testimonials" },
    { label: t.nav.notices, href: "#notices" },
    { label: t.nav.downloads, href: "#resources" },
    { label: t.nav.faq, href: "#faq" },
  ], [t.nav]);

  const allLinks = useMemo(() => [...primaryLinks, ...moreLinks], [primaryLinks, moreLinks]);

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let raf = 0;
    const ids = allLinks.map((l) => l.href.replace("#", ""));
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY + 120;
        let current = allLinks[0]?.href ?? "#home";
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
  }, [allLinks]);

  const isMoreActive = moreLinks.some((l) => l.href === activeHref);

  const renderLink = (link: NavItem, active: boolean) => (
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

  return (
    <nav className="fixed top-0 left-0 right-0 z-[90]">
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
              {primaryLinks.map((link) => renderLink(link, activeHref === link.href))}

              {/* More dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`px-3 py-2 text-sm rounded-xl transition-all flex items-center gap-1 ${
                    isMoreActive
                      ? "text-foreground bg-secondary/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <span className="relative">
                    {t.nav.more}
                    {isMoreActive && (
                      <span
                        aria-hidden
                        className="absolute left-1/2 -bottom-2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_0_6px_hsl(var(--primary)/0.18)]"
                      />
                    )}
                  </span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-background/80 backdrop-blur-2xl border border-border shadow-xl p-1.5 z-50"
                    >
                      {moreLinks.map((link) => {
                        const active = activeHref === link.href;
                        return (
                          <a
                            key={link.href}
                            href={link.href}
                            onClick={() => setMoreOpen(false)}
                            className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                              active
                                ? "text-foreground bg-secondary/60"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                            }`}
                          >
                            {link.label}
                          </a>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                className="md:hidden overflow-hidden relative z-[100]"
                style={{ pointerEvents: "auto" }}
              >
                <div className="px-3 pb-3">
                  <div className="glass-card p-2">
                    <div className="flex flex-col">
                      {allLinks.map((link) => {
                        const active = activeHref === link.href;
                        return (
                          <a
                            key={link.href}
                            href={link.href}
                            onClick={(e) => {
                              e.preventDefault();
                              setMobileOpen(false);
                              const id = link.href.replace("#", "");
                              setTimeout(() => {
                                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }, 200);
                            }}
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
