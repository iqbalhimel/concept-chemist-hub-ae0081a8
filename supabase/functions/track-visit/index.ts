import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
const IP_MAX_REQUESTS = 120;
const IP_BURST_WINDOW_MS = 5_000;
const IP_MAX_BURST = 15;

const ipWindow = new Map<string, { count: number; windowStart: number }>();
const ipBurstWindow = new Map<string, { count: number; windowStart: number }>();

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
  const patterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /httpclient/i,
    /scrapy/i,
    /bot/i,
    /crawler/i,
    /spider/i,
  ];
  return patterns.some((re) => re.test(ua));
}

function checkRateLimit(ip: string, now: number): boolean {
  // Long window
  const long = ipWindow.get(ip) || { count: 0, windowStart: now };
  if (now - long.windowStart > IP_WINDOW_MS) {
    long.count = 0;
    long.windowStart = now;
  }
  long.count += 1;
  ipWindow.set(ip, long);

  if (long.count > IP_MAX_REQUESTS) return true;

  // Short burst window
  const burst = ipBurstWindow.get(ip) || { count: 0, windowStart: now };
  if (now - burst.windowStart > IP_BURST_WINDOW_MS) {
    burst.count = 0;
    burst.windowStart = now;
  }
  burst.count += 1;
  ipBurstWindow.set(ip, burst);

  return burst.count > IP_MAX_BURST;
}

interface TrackPayload {
  action: "start" | "pageview" | "heartbeat" | "end";
  session_id: string;
  page_path?: string;
  device_type?: string;
  os?: string;
  browser?: string;
  screen_resolution?: string;
  referrer?: string;
  pages_viewed?: number;
  time_spent_seconds?: number;
}

async function getGeoData(ip: string) {
  try {
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return { country: "Local", city: "Local", lat: 0, lon: 0 };
    }
    const resp = await fetch(`https://ip-api.com/json/${ip}?fields=country,city,lat,lon`);
    if (resp.ok) {
      const data = await resp.json();
      return { country: data.country || "Unknown", city: data.city || "Unknown", lat: data.lat || 0, lon: data.lon || 0 };
    }
  } catch { /* ignore */ }
  return { country: "Unknown", city: "Unknown", lat: 0, lon: 0 };
}

Deno.serve(async (req) => {
  const baseHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: baseHeaders });
  }

  const ip = getIp(req);
  const ua = req.headers.get("user-agent");
  const now = Date.now();

  // Very basic bot / abuse detection on UA
  try {
    const raw = await req.text();
    if (raw.length > 4000) {
      console.warn("[track-visit] Payload too large from IP:", ip);
      return new Response(JSON.stringify({ error: "Payload too large" }), {
        status: 413,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    let payload: TrackPayload;
    try {
      payload = JSON.parse(raw) as TrackPayload;
    } catch {
      console.warn("[track-visit] Malformed JSON from IP:", ip);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, session_id } = payload;

    if (!session_id || typeof session_id !== "string" || session_id.length > 128) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["start", "pageview", "heartbeat", "end"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic abuse protection: ignore obviously bogus page paths and large counters
    const pagePath =
      typeof payload.page_path === "string" && payload.page_path.length <= 512
        ? payload.page_path
        : "/";
    const pagesViewed =
      typeof payload.pages_viewed === "number" && payload.pages_viewed > 0 && payload.pages_viewed < 1000
        ? payload.pages_viewed
        : 1;
    const timeSpentSeconds =
      typeof payload.time_spent_seconds === "number" &&
      payload.time_spent_seconds >= 0 &&
      payload.time_spent_seconds < 24 * 60 * 60
        ? payload.time_spent_seconds
        : 0;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (isSuspiciousUserAgent(ua)) {
      console.warn("[track-visit] Suspicious user agent blocked:", ua, "ip:", ip);
      // Log a high-severity analytics abuse event
      await supabase.from("security_logs").insert({
        event_type: "analytics_abuse_detected",
        description: "Suspicious analytics user-agent blocked at track-visit",
        ip_address: ip,
        user_email: null,
        user_id: null,
        metadata: { severity: "high", reason: "suspicious_user_agent" },
      });
      return new Response(JSON.stringify({ error: "Blocked" }), {
        status: 429,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    // Global per-IP rate limiting
    if (checkRateLimit(ip, now)) {
      console.warn("[track-visit] Rate limit exceeded for IP:", ip);
      await supabase.from("security_logs").insert({
        event_type: "analytics_abuse_detected",
        description: "Rate limit exceeded at track-visit",
        ip_address: ip,
        user_email: null,
        user_id: null,
        metadata: { severity: "high", reason: "rate_limit_exceeded" },
      });
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "start") {
      const geo = await getGeoData(ip);

      await supabase.from("visitor_sessions").upsert(
        {
          session_id,
          ip_address: ip,
          country: geo.country,
          city: geo.city,
          latitude: geo.lat,
          longitude: geo.lon,
          device_type:
            typeof payload.device_type === "string" ? payload.device_type.slice(0, 50) : "Desktop",
          os: typeof payload.os === "string" ? payload.os.slice(0, 50) : "Unknown",
          browser: typeof payload.browser === "string" ? payload.browser.slice(0, 50) : "Unknown",
          screen_resolution:
            typeof payload.screen_resolution === "string"
              ? payload.screen_resolution.slice(0, 20)
              : "Unknown",
          referrer: typeof payload.referrer === "string" ? payload.referrer.slice(0, 255) : "Direct",
          entry_page: pagePath,
          exit_page: pagePath,
          pages_viewed: 1,
          is_active: true,
          started_at: new Date().toISOString(),
        },
        { onConflict: "session_id" },
      );

      // Record first page view
      await supabase.from("page_views").insert({
        session_id,
        page_path: pagePath,
      });
    } else if (action === "pageview") {
      await supabase.from("page_views").insert({
        session_id,
        page_path: pagePath,
      });

      await supabase
        .from("visitor_sessions")
        .update({
          exit_page: pagePath,
          pages_viewed: pagesViewed,
          is_active: true,
        })
        .eq("session_id", session_id);
    } else if (action === "heartbeat") {
      await supabase
        .from("visitor_sessions")
        .update({
          is_active: true,
          time_spent_seconds: timeSpentSeconds,
          exit_page: pagePath,
        })
        .eq("session_id", session_id);
    } else if (action === "end") {
      await supabase
        .from("visitor_sessions")
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          time_spent_seconds: timeSpentSeconds,
          exit_page: pagePath,
          pages_viewed: pagesViewed,
        })
        .eq("session_id", session_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Track visit error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });
  }
});
