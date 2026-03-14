import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://inv.tux.pizza",
  "https://yewtu.be",
  "https://invidious.privacyredirect.com",
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

async function tryYouTubePlayer(videoId: string): Promise<string> {
  // Try multiple client types
  const clients = [
    { clientName: "ANDROID", clientVersion: "19.09.37", androidSdkVersion: 30 },
    { clientName: "IOS", clientVersion: "19.09.3" },
    { clientName: "WEB", clientVersion: "2.20240101.00.00" },
  ];

  for (const client of clients) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(
        "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
          },
          body: JSON.stringify({
            videoId,
            context: { client: { hl: "en", gl: "US", ...client } },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const secs = parseInt(data?.videoDetails?.lengthSeconds || "0");
        if (secs > 0) {
          return formatDuration(secs);
        }
      }
    } catch {
      // try next client
    }
  }
  return "";
}

async function tryInvidious(videoId: string): Promise<string> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(
        `${instance}/api/v1/videos/${encodeURIComponent(videoId)}?fields=lengthSeconds`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.lengthSeconds && data.lengthSeconds > 0) {
          return formatDuration(data.lengthSeconds);
        }
      }
    } catch {
      // try next instance
    }
  }
  return "";
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

    // Race both approaches for speed
    const [ytDuration, invDuration] = await Promise.allSettled([
      tryYouTubePlayer(videoId),
      tryInvidious(videoId),
    ]);

    const duration =
      (ytDuration.status === "fulfilled" && ytDuration.value) ||
      (invDuration.status === "fulfilled" && invDuration.value) ||
      "";

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
