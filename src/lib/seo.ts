/**
 * Set document meta tags dynamically for SEO & Open Graph.
 * Call in useEffect; returns a cleanup that restores defaults.
 */
interface SeoParams {
  title: string;
  description: string;
  url?: string;
  image?: string;
  type?: string;
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

export function setSeo({ title, description, url, image, type = "article" }: SeoParams) {
  document.title = title;
  setMeta("description", description);

  setMeta("og:title", title, "property");
  setMeta("og:description", description, "property");
  setMeta("og:type", type, "property");
  if (url) setMeta("og:url", url, "property");
  if (image) setMeta("og:image", image, "property");

  setMeta("twitter:title", title, "name");
  setMeta("twitter:description", description, "name");
  if (image) setMeta("twitter:image", image, "name");

  return () => {
    document.title = DEFAULTS.title;
    setMeta("description", DEFAULTS.description);
    setMeta("og:title", DEFAULTS.title, "property");
    setMeta("og:description", DEFAULTS.description, "property");
    setMeta("og:type", "website", "property");
  };
}
