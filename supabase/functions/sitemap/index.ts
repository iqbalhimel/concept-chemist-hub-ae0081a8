import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=utf-8",
};

const SITE = "https://iqbalsir.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // Fetch published blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, id, updated_at")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  // Fetch active study material categories
  const { data: categories } = await supabase
    .from("study_categories")
    .select("slug")
    .eq("is_active", true);

  const langs = ["en", "bn"];

  let urls = "";

  // Helper to add a URL entry with hreflang alternates
  const addUrl = (path: string, priority: string, changefreq: string, lastmod?: string) => {
    const enUrl = `${SITE}/en${path}`;
    const bnUrl = `${SITE}/bn${path}`;
    for (const lang of langs) {
      const loc = lang === "en" ? enUrl : bnUrl;
      urls += `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="bn" href="${bnUrl}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
  </url>\n`;
    }
  };

  // Static pages
  addUrl("", "1.0", "weekly");
  addUrl("/blog", "0.8", "daily");
  addUrl("/testimonials", "0.7", "weekly");
  addUrl("/notices", "0.7", "daily");
  addUrl("/resources", "0.8", "weekly");

  // Blog posts
  if (posts) {
    for (const post of posts) {
      const slug = post.slug || post.id;
      const lastmod = post.updated_at ? post.updated_at.split("T")[0] : undefined;
      addUrl(`/blog/${slug}`, "0.6", "monthly", lastmod);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Cache-Control": "public, max-age=3600" },
  });
});
