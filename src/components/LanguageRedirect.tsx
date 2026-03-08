import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/** Redirects bare URLs (/, /blog, etc.) to the lang-prefixed version */
const LanguageRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    // Skip if already has lang prefix or is admin/auth route
    if (path.startsWith("/en") || path.startsWith("/bn") || path.startsWith("/admin") || path.startsWith("/forgot") || path.startsWith("/reset")) return;

    // Detect preferred language
    let lang = "en";
    try {
      const saved = localStorage.getItem("language");
      if (saved === "bn" || saved === "en") { lang = saved; }
      else {
        const browserLang = navigator.language || "";
        if (browserLang.startsWith("bn")) lang = "bn";
      }
    } catch {}

    navigate(`/${lang}${path === "/" ? "" : path}${location.hash}`, { replace: true });
  }, []);

  return null;
};

export default LanguageRedirect;
