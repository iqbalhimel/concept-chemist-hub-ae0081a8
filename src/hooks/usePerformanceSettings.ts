import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Reads performance settings from site_settings and applies them globally:
 * - Font preloading via <link rel="preload">
 * - Animation reduction via CSS class on <html>
 * - Lazy loading is handled by OptimizedImage component reading these settings
 */
export const usePerformanceSettings = () => {
  const { get, loaded } = useSiteSettings();

  const fontPreload = get("performance", "font_preload", "true") === "true";
  const reduceAnimations = get("performance", "reduce_animations", "false") === "true";
  const lazyLoading = get("performance", "lazy_loading", "true") === "true";

  // Font preloading
  useEffect(() => {
    if (!loaded) return;

    const FONT_PRELOAD_ID = "perf-font-preload";
    // Remove existing preload tags
    document.querySelectorAll(`[data-perf-font]`).forEach((el) => el.remove());

    if (fontPreload) {
      // Detect Google Fonts links already in the page
      const googleFontLinks = document.querySelectorAll<HTMLLinkElement>(
        'link[href*="fonts.googleapis.com"]'
      );
      googleFontLinks.forEach((link) => {
        // Add preconnect for gstatic
        if (!document.querySelector('link[href="https://fonts.gstatic.com"][rel="preconnect"]')) {
          const preconnect = document.createElement("link");
          preconnect.rel = "preconnect";
          preconnect.href = "https://fonts.gstatic.com";
          preconnect.crossOrigin = "anonymous";
          preconnect.setAttribute("data-perf-font", "true");
          document.head.prepend(preconnect);
        }
        // Convert stylesheet to preload + stylesheet
        if (link.rel === "stylesheet" && !link.hasAttribute("data-preloaded")) {
          const preload = document.createElement("link");
          preload.rel = "preload";
          preload.as = "style";
          preload.href = link.href;
          preload.setAttribute("data-perf-font", "true");
          document.head.prepend(preload);
          link.setAttribute("data-preloaded", "true");
        }
      });
    }
  }, [fontPreload, loaded]);

  // Animation reduction
  useEffect(() => {
    if (!loaded) return;
    const html = document.documentElement;

    // Check for mobile or reduced-motion preference
    const isMobile = window.innerWidth < 768;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldReduce = reduceAnimations || prefersReduced || (reduceAnimations && isMobile);

    if (shouldReduce) {
      html.classList.add("reduce-motion");
    } else {
      html.classList.remove("reduce-motion");
    }

    return () => {
      html.classList.remove("reduce-motion");
    };
  }, [reduceAnimations, loaded]);

  return {
    lazyLoading,
    reduceAnimations,
    fontPreload,
    imgCompress: get("performance", "img_compress", "true") === "true",
    imgWebp: get("performance", "img_webp", "true") === "true",
    imgMaxWidth: parseInt(get("performance", "img_max_width", "1920"), 10),
    imgMaxHeight: parseInt(get("performance", "img_max_height", "1920"), 10),
    imgQuality: parseInt(get("performance", "img_quality", "82"), 10),
    loaded,
  };
};
