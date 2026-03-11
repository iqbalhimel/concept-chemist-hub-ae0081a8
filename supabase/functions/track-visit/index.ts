import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const resp = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,lat,lon`);
    if (resp.ok) {
      const data = await resp.json();
      return { country: data.country || "Unknown", city: data.city || "Unknown", lat: data.lat || 0, lon: data.lon || 0 };
    }
  } catch { /* ignore */ }
  return { country: "Unknown", city: "Unknown", lat: 0, lon: 0 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload: TrackPayload = await req.json();
    const { action, session_id } = payload;

    if (!session_id) {
      return new Response(JSON.stringify({ error: "session_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
        device_type: payload.device_type || "Desktop",
        os: payload.os || "Unknown",
        browser: payload.browser || "Unknown",
        screen_resolution: payload.screen_resolution || "Unknown",
        referrer: payload.referrer || "Direct",
        entry_page: payload.page_path || "/",
        exit_page: payload.page_path || "/",
        pages_viewed: 1,
        is_active: true,
        started_at: new Date().toISOString(),
      }, { onConflict: "session_id" });

      // Record first page view
      await supabase.from("page_views").insert({
        session_id,
        page_path: payload.page_path || "/",
      });
    } else if (action === "pageview") {
      await supabase.from("page_views").insert({
        session_id,
        page_path: payload.page_path || "/",
      });

      await supabase
        .from("visitor_sessions")
        .update({
          exit_page: payload.page_path || "/",
          pages_viewed: payload.pages_viewed || 1,
          is_active: true,
        })
        .eq("session_id", session_id);
    } else if (action === "heartbeat") {
      await supabase
        .from("visitor_sessions")
        .update({
          is_active: true,
          time_spent_seconds: payload.time_spent_seconds || 0,
          exit_page: payload.page_path || "/",
        })
        .eq("session_id", session_id);
    } else if (action === "end") {
      await supabase
        .from("visitor_sessions")
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          time_spent_seconds: payload.time_spent_seconds || 0,
          exit_page: payload.page_path || "/",
          pages_viewed: payload.pages_viewed || 1,
        })
        .eq("session_id", session_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Track visit error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
