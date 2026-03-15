import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { setSeo, generatePersonSchema, generateEducationalOrgSchema, generateWebSiteSchema } from "@/lib/seo";

/**
 * Injects global SEO meta tags from site_settings on every page.
 * Page-level SEO (e.g. BlogPost) can override by calling setSeo() later.
 */
const SeoHead = () => {
  const { settings, loaded } = useSiteSettings();

  useEffect(() => {
    if (!loaded) return;

    const seo = settings.seo || {};
    const contact = settings.contact || {};

    // Verification tags
    if (seo.gsc_code) {
      let el = document.querySelector('meta[name="google-site-verification"]') as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = "google-site-verification";
        document.head.appendChild(el);
      }
      el.content = seo.gsc_code;
    }
    if (seo.bing_code) {
      let el = document.querySelector('meta[name="msvalidate.01"]') as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.name = "msvalidate.01";
        document.head.appendChild(el);
      }
      el.content = seo.bing_code;
    }

    const cleanup = setSeo({
      title: seo.meta_title || "Iqbal Sir – Science Teacher in Kishoreganj",
      description: seo.meta_description || "Best science teacher in Kishoreganj.",
      url: seo.canonical_url || window.location.origin,
      image: seo.og_image || undefined,
      type: "website",
      keywords: seo.meta_keywords,
      canonicalUrl: seo.canonical_url,
      robotsIndex: seo.robots_index,
      robotsFollow: seo.robots_follow,
      twitterCard: seo.twitter_card,
      twitterTitle: seo.twitter_title,
      twitterDescription: seo.twitter_description,
      twitterImage: seo.twitter_image,
      jsonLd: [
        generatePersonSchema(seo, contact),
        generateEducationalOrgSchema(seo, contact),
      ],
    });

    return cleanup;
  }, [settings, loaded]);

  return null;
};

export default SeoHead;
