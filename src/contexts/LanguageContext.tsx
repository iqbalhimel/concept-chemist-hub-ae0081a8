import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import en from "@/translations/en.json";
import bn from "@/translations/bn.json";

export type Lang = "en" | "bn";
type Translations = typeof en;

const translations: Record<Lang, Translations> = { en, bn };

interface LanguageContextType {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
  switchLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: en,
  setLang: () => {},
  switchLang: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

/** Detect initial language: URL > localStorage > browser > en */
function detectLang(pathname: string): Lang {
  // Check URL first
  if (pathname.startsWith("/bn")) return "bn";
  if (pathname.startsWith("/en")) return "en";
  // localStorage
  try {
    const saved = localStorage.getItem("language");
    if (saved === "bn" || saved === "en") return saved;
  } catch {}
  // Browser language
  const browserLang = navigator.language || (navigator as any).userLanguage || "";
  if (browserLang.startsWith("bn")) return "bn";
  return "en";
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [lang, setLangState] = useState<Lang>(() => detectLang(location.pathname));

  // Sync lang from URL changes
  useEffect(() => {
    if (location.pathname.startsWith("/bn") && lang !== "bn") setLangState("bn");
    else if (location.pathname.startsWith("/en") && lang !== "en") setLangState("en");
  }, [location.pathname]);

  // Persist
  useEffect(() => {
    try { localStorage.setItem("language", lang); } catch {}
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    // Update URL prefix
    const path = location.pathname;
    const hash = location.hash;
    let newPath: string;
    if (path.startsWith("/en") || path.startsWith("/bn")) {
      newPath = `/${newLang}${path.slice(3)}`;
    } else {
      newPath = `/${newLang}${path}`;
    }
    navigate(newPath + hash, { replace: true });
  }, [location.pathname, location.hash, navigate]);

  const switchLang = useCallback(() => {
    setLang(lang === "en" ? "bn" : "en");
  }, [lang, setLang]);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, t, setLang, switchLang }}>
      {children}
    </LanguageContext.Provider>
  );
};
