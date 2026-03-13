import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type PageSpeedResult = {
  url: string;
  strategy: "mobile" | "desktop";
  fetchTime: string;
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  metrics: {
    lcp: number;
    fcp: number;
    cls: number;
    tbt: number;
    si: number;
    tti: number;
  };
  diagnostics: {
    title: string;
    description: string;
    score: number;
    savings?: number;
  }[];
  quotaExceeded?: boolean;
  status?: "ok" | "quota_exceeded" | "cached_quota";
  message?: string;
};

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
const IP_MAX_REQUESTS = 20;

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

const CACHE_TTL_MS = 15 * 60 * 1000;
const QUOTA_COOLDOWN_MS = 60 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; data: PageSpeedResult }>();
const quotaCooldown = new Map<string, number>();

function emptyResult(url: string, strategy: "mobile" | "desktop", message: string): PageSpeedResult {
  return {
    url,
    strategy,
    fetchTime: new Date().toISOString(),
    scores: {
      performance: 0,
      seo: 0,
      accessibility: 0,
      bestPractices: 0,
    },
    metrics: {
      lcp: 0,
      fcp: 0,
      cls: 0,
      tbt: 0,
      si: 0,
      tti: 0,
    },
    diagnostics: [
      {
        title: "PageSpeed quota exceeded",
        description: message,
        score: 0,
      },
    ],
  };
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
      console.warn("[pagespeed] Payload too large from ip:", ip);
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any;
    try {
      body = JSON.parse(raw);
    } catch {
      console.warn("[pagespeed] Invalid JSON from ip:", ip);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const url = (body?.url as string | undefined) || "";
    const strategy = body?.strategy === "desktop" ? "desktop" : "mobile";

    if (!url || url.length > 2048) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = `${strategy}:${url}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(JSON.stringify({ ...cached.data, status: "ok" }), {
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const cooldownUntil = quotaCooldown.get(strategy);
    if (cooldownUntil && cooldownUntil > Date.now()) {
      const message = "PageSpeed daily quota is exhausted. Please try again later.";
      const fallback = cached?.data
        ? { ...cached.data, status: "cached_quota" as const, quotaExceeded: true, message }
        : {
            ...emptyResult(url, strategy, message),
            status: "quota_exceeded" as const,
            quotaExceeded: true,
            message,
          };

      return new Response(JSON.stringify(fallback), {
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(
      url,
    )}&strategy=${strategy}&category=performance&category=seo&category=accessibility&category=best-practices`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || "PageSpeed API error";
      const isQuotaError =
        response.status === 429 || /quota/i.test(message) || /queries per day/i.test(message);

      if (isQuotaError) {
        quotaCooldown.set(strategy, Date.now() + QUOTA_COOLDOWN_MS);

        const fallback = cached?.data
          ? { ...cached.data, status: "cached_quota" as const, quotaExceeded: true, message }
          : {
              ...emptyResult(url, strategy, message),
              status: "quota_exceeded" as const,
              quotaExceeded: true,
              message,
            };

        return new Response(JSON.stringify(fallback), {
          headers: { ...baseHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: message }), {
        status: response.status,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const lighthouse = data.lighthouseResult;
    const categories = lighthouse?.categories || {};
    const audits = lighthouse?.audits || {};

    const result: PageSpeedResult = {
      url: data.id,
      strategy,
      fetchTime: lighthouse?.fetchTime,
      scores: {
        performance: Math.round((categories.performance?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((categories["best-practices"]?.score || 0) * 100),
      },
      metrics: {
        lcp: audits["largest-contentful-paint"]?.numericValue || 0,
        fcp: audits["first-contentful-paint"]?.numericValue || 0,
        cls: audits["cumulative-layout-shift"]?.numericValue || 0,
        tbt: audits["total-blocking-time"]?.numericValue || 0,
        si: audits["speed-index"]?.numericValue || 0,
        tti: audits["interactive"]?.numericValue || 0,
      },
      diagnostics: Object.entries(audits)
        .filter(
          ([_, audit]: [string, any]) =>
            audit.score !== null && audit.score < 1 && audit.details?.type === "opportunity",
        )
        .slice(0, 5)
        .map(([_, audit]: [string, any]) => ({
          title: audit.title,
          description: audit.description,
          score: audit.score,
          savings: audit.details?.overallSavingsMs,
        })),
      status: "ok",
      quotaExceeded: false,
    };

    cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, data: result });

    return new Response(JSON.stringify(result), {
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });
  }
});
