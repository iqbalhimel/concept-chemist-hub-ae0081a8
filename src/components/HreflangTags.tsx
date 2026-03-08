import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

/** Injects hreflang link tags for SEO */
const HreflangTags = () => {
  const { lang } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    // Remove existing hreflang tags
    document.querySelectorAll('link[hreflang]').forEach(el => el.remove());

    const origin = window.location.origin;
    const pathWithoutLang = location.pathname.replace(/^\/(en|bn)/, "") || "/";

    const enUrl = `${origin}/en${pathWithoutLang}`;
    const bnUrl = `${origin}/bn${pathWithoutLang}`;

    const addLink = (hreflang: string, href: string) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = hreflang;
      link.href = href;
      document.head.appendChild(link);
    };

    addLink("en", enUrl);
    addLink("bn", bnUrl);
    addLink("x-default", enUrl);
  }, [location.pathname, lang]);

  return null;
};

export default HreflangTags;
