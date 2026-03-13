import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = new Set<string>([
  "https://iqbalsir.bd",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IP_WINDOW_MS = 60_000;
const IP_MAX_REQUESTS = 30;

const ipWindow = new Map<string, { count: number; windowStart: number }>();

function getCorsOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  return ALLOWED_ORIGINS.has(origin) ? origin : "";
}

function buildCorsHeaders(req: Request) {
  const origin = getCorsOrigin(req);
  return {
    ...corsHeaders,
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}

function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

function isSuspiciousUserAgent(ua: string | null): boolean {
  if (!ua || ua === "-" || ua.trim().length < 6) return true;
  const patterns = [/curl/i, /wget/i, /python-requests/i, /httpclient/i, /bot/i, /crawler/i, /spider/i];
  return patterns.some((re) => re.test(ua));
}

function checkRateLimit(ip: string, now: number): boolean {
  const entry = ipWindow.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > IP_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  ipWindow.set(ip, entry);
  return entry.count > IP_MAX_REQUESTS;
}

async function checkPage(url: string): Promise<any> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    const html = await res.text();
    const status = res.status;

    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
    const title = titleMatch?.[1]?.trim() || '';
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is);
    const metaDesc = metaDescMatch?.[1]?.trim() || '';
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/is);
    const ogTitle = ogTitleMatch?.[1]?.trim() || '';
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["']/is);
    const ogDesc = ogDescMatch?.[1]?.trim() || '';
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/is);
    const canonical = canonicalMatch?.[1]?.trim() || '';
    const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gis) || [];
    const imgMissingAlt = (html.match(/<img(?![^>]*alt=)[^>]*>/gi) || []).length;

    const issues: string[] = [];
    if (!title) issues.push('Missing page title');
    else if (title.length > 60) issues.push(`Title too long (${title.length} chars, max 60)`);
    if (!metaDesc) issues.push('Missing meta description');
    else if (metaDesc.length > 160) issues.push(`Meta description too long (${metaDesc.length} chars, max 160)`);
    if (!ogTitle) issues.push('Missing og:title');
    if (!ogDesc) issues.push('Missing og:description');
    if (!canonical) issues.push('Missing canonical URL');
    if (h1Matches.length === 0) issues.push('Missing H1 tag');
    if (h1Matches.length > 1) issues.push(`Multiple H1 tags found (${h1Matches.length})`);
    if (imgMissingAlt > 0) issues.push(`${imgMissingAlt} image(s) missing alt text`);

    return {
      url,
      status,
      title,
      metaDesc: metaDesc.substring(0, 80) + (metaDesc.length > 80 ? '...' : ''),
      hasOgTitle: !!ogTitle,
      hasOgDesc: !!ogDesc,
      hasCanonical: !!canonical,
      h1Count: h1Matches.length,
      imgMissingAlt,
      issues,
      score: Math.max(0, 100 - issues.length * 12),
    };
  } catch (error) {
    return {
      url,
      status: 0,
      title: '',
      metaDesc: '',
      issues: [`Failed to fetch: ${error instanceof Error ? error.message : 'Unknown'}`],
      score: 0,
    };
  }
}

serve(async (req) => {
  const baseHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: baseHeaders });
  }

  const ip = getIp(req);
  const ua = req.headers.get("user-agent");
  const now = Date.now();

  try {
    const raw = await req.text();
    if (raw.length > 4000) {
      console.warn("[seo-health-check] Payload too large from ip:", ip);
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any;
    try {
      body = JSON.parse(raw);
    } catch {
      console.warn("[seo-health-check] Invalid JSON from ip:", ip);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const { siteUrl } = body;
    if (!siteUrl || typeof siteUrl !== "string" || siteUrl.length > 2048) {
      return new Response(JSON.stringify({ error: "siteUrl is required" }), {
        status: 400,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const base = siteUrl.replace(/\/$/, "");
    const pages = [
      { path: "/", label: "Homepage" },
      { path: "/en", label: "Homepage (EN)" },
      { path: "/bn", label: "Homepage (BN)" },
      { path: "/en/blog", label: "Blog" },
      { path: "/en/resources", label: "Resources" },
      { path: "/en/notices", label: "Notices" },
      { path: "/en/testimonials", label: "Testimonials" },
    ];

    // Check sitemap and robots
    let sitemapStatus = "unknown";
    let robotsStatus = "unknown";

    try {
      const sitemapRes = await fetch(`${base}/sitemap.xml`);
      await sitemapRes.text();
      sitemapStatus = sitemapRes.ok ? "ok" : "missing";
    } catch {
      sitemapStatus = "error";
    }

    try {
      const robotsRes = await fetch(`${base}/robots.txt`);
      await robotsRes.text();
      robotsStatus = robotsRes.ok ? "ok" : "missing";
    } catch {
      robotsStatus = "error";
    }

    const pageResults = await Promise.all(
      pages.map((p) => checkPage(`${base}${p.path}`).then((r) => ({ ...r, label: p.label })))
    );

    // Check for duplicate titles
    const titles = pageResults.filter(p => p.title).map(p => p.title);
    const duplicateTitles = titles.filter((t, i) => titles.indexOf(t) !== i);

    const totalIssues =
      pageResults.reduce((sum, p) => sum + p.issues.length, 0) +
      (sitemapStatus !== "ok" ? 1 : 0) +
      (robotsStatus !== "ok" ? 1 : 0) +
      duplicateTitles.length;

    const overallScore = Math.max(
      0,
      Math.round(pageResults.reduce((sum, p) => sum + p.score, 0) / pageResults.length),
    );

    return new Response(
      JSON.stringify({
        overallScore,
        totalIssues,
        sitemapStatus,
        robotsStatus,
        duplicateTitles: [...new Set(duplicateTitles)],
        pages: pageResults,
        checkedAt: new Date().toISOString(),
      }),
      {
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });
  }
});
