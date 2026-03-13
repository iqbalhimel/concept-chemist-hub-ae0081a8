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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload: TrackPayload = await req.json();
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
      typeof payload.time_spent_seconds === "number" && payload.time_spent_seconds >= 0 && payload.time_spent_seconds < 24 * 60 * 60
        ? payload.time_spent_seconds
        : 0;

    // Get client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "Unknown";

    if (action === "start") {
      const geo = await getGeoData(ip);

      await supabase.from("visitor_sessions").upsert({
        session_id,
        ip_address: ip,
        country: geo.country,
        city: geo.city,
        latitude: geo.lat,
        longitude: geo.lon,
        device_type: typeof payload.device_type === "string" ? payload.device_type.slice(0, 50) : "Desktop",
        os: typeof payload.os === "string" ? payload.os.slice(0, 50) : "Unknown",
        browser: typeof payload.browser === "string" ? payload.browser.slice(0, 50) : "Unknown",
        screen_resolution:
          typeof payload.screen_resolution === "string" ? payload.screen_resolution.slice(0, 20) : "Unknown",
        referrer: typeof payload.referrer === "string" ? payload.referrer.slice(0, 255) : "Direct",
        entry_page: pagePath,
        exit_page: pagePath,
        pages_viewed: 1,
        is_active: true,
        started_at: new Date().toISOString(),
      }, { onConflict: "session_id" });

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
