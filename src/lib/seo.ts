/**
 * Advanced SEO utilities — dynamic meta tags, robots, canonical, Twitter Card, JSON-LD.
 */

interface SeoParams {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: string;
  keywords?: string;
  canonicalUrl?: string;
  robotsIndex?: string;
  robotsFollow?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const DEFAULTS = {
  title: "Iqbal Sir – Science Teacher in Kishoreganj | Physics, Chemistry & SSC Coaching",
  description:
    "Best science teacher in Kishoreganj. Expert physics & chemistry teacher for SSC & HSC students. Concept-based learning with multimedia classes.",
};

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string, extra?: Record<string, string>) {
  let selector = `link[rel="${rel}"]`;
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => { selector += `[${k}="${v}"]`; });
  }
  let el = document.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    if (extra) Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  // Remove existing
  document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
  const items = Array.isArray(data) ? data : [data];
  items.forEach(item => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-seo-jsonld", "true");
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

function removeJsonLd() {
  document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove());
}

export function setSeo(params: SeoParams) {
  const {
    title, description, url, image, type = "article",
    keywords, canonicalUrl, robotsIndex, robotsFollow,
    twitterCard, twitterTitle, twitterDescription, twitterImage,
    jsonLd,
  } = params;

  document.title = title;
  setMeta("description", description);
  if (keywords) setMeta("keywords", keywords);

  // Robots
  const robots = `${robotsIndex || "index"}, ${robotsFollow || "follow"}`;
  setMeta("robots", robots);

  // Canonical
  if (canonicalUrl || url) setLink("canonical", canonicalUrl || url!);

  // Open Graph
  setMeta("og:title", title, "property");
  setMeta("og:description", description, "property");
  setMeta("og:type", type, "property");
  if (url) setMeta("og:url", url, "property");
  if (image) setMeta("og:image", image, "property");

  // Twitter Card
  setMeta("twitter:card", twitterCard || "summary_large_image", "name");
  setMeta("twitter:title", twitterTitle || title, "name");
  setMeta("twitter:description", twitterDescription || description, "name");
  if (twitterImage || image) setMeta("twitter:image", twitterImage || image!, "name");

  // JSON-LD
  if (jsonLd) setJsonLd(jsonLd);

  return () => {
    document.title = DEFAULTS.title;
    setMeta("description", DEFAULTS.description);
    setMeta("og:title", DEFAULTS.title, "property");
    setMeta("og:description", DEFAULTS.description, "property");
    setMeta("og:type", "website", "property");
    setMeta("robots", "index, follow");
    removeJsonLd();
  };
}

/* ── JSON-LD Schema Generators ────────────────────── */

export function generatePersonSchema(seoSettings: Record<string, string>, contactSettings: Record<string, string>) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: seoSettings.meta_title?.split("–")[0]?.trim() || "Iqbal Sir",
    url: seoSettings.canonical_url || "https://iqbalsir.bd",
    image: seoSettings.og_image || undefined,
    jobTitle: "Science Teacher",
    description: seoSettings.meta_description || DEFAULTS.description,
    address: contactSettings.address ? {
      "@type": "PostalAddress",
      addressLocality: "Kishoreganj",
      addressCountry: "BD",
      streetAddress: contactSettings.address,
    } : undefined,
    telephone: contactSettings.phone || undefined,
    email: contactSettings.email || undefined,
  };
}

export function generateEducationalOrgSchema(seoSettings: Record<string, string>, contactSettings: Record<string, string>) {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Iqbal Sir's Science Coaching",
    url: seoSettings.canonical_url || "https://iqbalsir.bd",
    description: seoSettings.meta_description || DEFAULTS.description,
    address: contactSettings.address ? {
      "@type": "PostalAddress",
      addressLocality: "Kishoreganj",
      addressCountry: "BD",
    } : undefined,
    telephone: contactSettings.phone || undefined,
  };
}

export function generateArticleSchema(post: {
  title: string;
  excerpt?: string | null;
  content?: string | null;
  slug?: string | null;
  id: string;
  created_at: string;
  featured_image?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.featured_image || undefined,
    datePublished: post.created_at,
    url: `https://iqbalsir.com/blog/${post.slug || post.id}`,
    author: {
      "@type": "Person",
      name: "Iqbal Sir",
    },
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
