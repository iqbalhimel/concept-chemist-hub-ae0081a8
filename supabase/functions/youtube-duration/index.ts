import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.r4fo.com",
  "https://api.piped.privacydev.net",
];

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://inv.tux.pizza",
  "https://yewtu.be",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    if (!videoId || typeof videoId !== "string") {
      return new Response(JSON.stringify({ error: "Missing videoId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let duration = "";

    // 1. Try Piped API instances
    for (const instance of PIPED_INSTANCES) {
      if (duration) break;
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${instance}/streams/${encodeURIComponent(videoId)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        clearTimeout(tid);
        if (res.ok) {
          const data = await res.json();
          if (data.duration && data.duration > 0) {
            duration = formatDuration(data.duration);
          }
        }
      } catch (_) { /* next */ }
    }

    // 2. Try Invidious API instances
    if (!duration) {
      for (const instance of INVIDIOUS_INSTANCES) {
        if (duration) break;
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 8000);
          const res = await fetch(
            `${instance}/api/v1/videos/${encodeURIComponent(videoId)}?fields=lengthSeconds`,
            { signal: controller.signal }
          );
          clearTimeout(tid);
          if (res.ok) {
            const data = await res.json();
            if (data.lengthSeconds && data.lengthSeconds > 0) {
              duration = formatDuration(data.lengthSeconds);
            }
          }
        } catch (_) { /* next */ }
      }
    }

    // 3. Try YouTube internal player API
    if (!duration) {
      try {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
          },
          body: JSON.stringify({
            videoId,
            context: {
              client: { clientName: "ANDROID", clientVersion: "19.09.37", androidSdkVersion: 30, hl: "en", gl: "US" },
            },
          }),
          signal: controller.signal,
        });
        clearTimeout(tid);
        if (res.ok) {
          const data = await res.json();
          const secs = parseInt(data?.videoDetails?.lengthSeconds || "0");
          if (secs > 0) {
            duration = formatDuration(secs);
          }
        }
      } catch (_) { /* skip */ }
    }

    return new Response(JSON.stringify({ duration }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
