import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://invidious.privacyredirect.com",
  "https://vid.puffyan.us",
];

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

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

    // Try Invidious instances for reliable metadata
    for (const instance of INVIDIOUS_INSTANCES) {
      if (duration) break;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(
          `${instance}/api/v1/videos/${encodeURIComponent(videoId)}?fields=lengthSeconds`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (res.ok) {
          const data = await res.json();
          if (data.lengthSeconds && data.lengthSeconds > 0) {
            duration = formatDuration(data.lengthSeconds);
            console.log(`Got duration from ${instance}: ${duration}`);
          }
        }
      } catch (e) {
        console.log(`${instance} failed: ${e.message}`);
      }
    }

    // Fallback: YouTube internal player API
    if (!duration) {
      try {
        const res = await fetch(
          "https://www.youtube.com/youtubei/v1/player",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              videoId,
              context: {
                client: {
                  clientName: "ANDROID",
                  clientVersion: "19.09.37",
                  androidSdkVersion: 30,
                  hl: "en",
                },
              },
            }),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const secs = parseInt(data?.videoDetails?.lengthSeconds || "0");
          if (secs > 0) {
            duration = formatDuration(secs);
            console.log(`Got duration from youtubei: ${duration}`);
          }
        }
      } catch (e) {
        console.log(`youtubei failed: ${e.message}`);
      }
    }

    console.log(`Video ${videoId}: final duration="${duration}"`);

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
