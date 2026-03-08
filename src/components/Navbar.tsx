import { useState, useEffect } from "react";
import { Menu, X, Moon, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBrightness } from "@/contexts/BrightnessContext";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { mode, toggle } = useBrightness();
  const { lang, t, switchLang } = useLanguage();

  const navLinks = [
    { label: t.nav.home, href: "#home" },
    { label: t.nav.about, href: "#about" },
    { label: t.nav.subjects, href: "#subjects" },
    { label: t.nav.experience, href: "#experience" },
    { label: t.nav.education, href: "#education" },
    { label: t.nav.resources, href: "#resources" },
    { label: t.nav.blog, href: "#blog" },
    { label: t.nav.contact, href: "#contact" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="w-full flex items-center justify-between h-16 md:h-20 px-4">
        <a href="#home" className="font-display text-xl font-bold gradient-text">
          Iqbal Sir
        </a>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary/50"
            >
              {link.label}
            </a>
          ))}
          {/* Language switcher */}
          <button
            onClick={switchLang}
            className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label="Switch language"
          >
            {lang === "en" ? "বাংলা" : "EN"}
          </button>
          {/* Brightness toggle */}
          <button
            onClick={toggle}
            className="ml-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {mode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={switchLang}
            className="px-2 py-1 rounded text-xs font-semibold border border-border text-muted-foreground"
          >
            {lang === "en" ? "বাং" : "EN"}
          </button>
          <button onClick={toggle} className="p-2 text-foreground">
            {mode === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground" aria-label="Toggle menu">
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
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
