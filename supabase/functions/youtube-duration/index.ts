import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Approach 1: Use YouTube's internal player API (no key needed)
    try {
      const playerRes = await fetch(
        "https://www.youtube.com/youtubei/v1/player",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            context: {
              client: {
                clientName: "WEB",
                clientVersion: "2.20240101.00.00",
                hl: "en",
              },
            },
          }),
        }
      );
      if (playerRes.ok) {
        const data = await playerRes.json();
        const lengthSeconds =
          data?.videoDetails?.lengthSeconds ||
          data?.streamingData?.formats?.[0]?.approxDurationMs
            ? Math.floor(
                parseInt(
                  data?.streamingData?.formats?.[0]?.approxDurationMs || "0"
                ) / 1000
              )
            : 0;

        const secs =
          typeof lengthSeconds === "string"
            ? parseInt(lengthSeconds)
            : lengthSeconds;

        if (secs > 0) {
          const h = Math.floor(secs / 3600);
          const m = Math.floor((secs % 3600) / 60);
          const s = secs % 60;
          duration = h > 0
            ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${m}:${String(s).padStart(2, "0")}`;
        }
      }
    } catch (e) {
      console.log("Player API failed:", e.message);
    }

    // Approach 2: Fallback — scrape the watch page for lengthSeconds
    if (!duration) {
      try {
        const watchRes = await fetch(
          `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9",
              Cookie: "CONSENT=YES+1",
            },
          }
        );
        if (watchRes.ok) {
          const html = await watchRes.text();
          const match = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
          if (match) {
            const secs = parseInt(match[1]);
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            const s = secs % 60;
            duration = h > 0
              ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
              : `${m}:${String(s).padStart(2, "0")}`;
          }
        }
      } catch (e) {
        console.log("Watch page scrape failed:", e.message);
      }
    }

    // Approach 3: Fallback — try embed page
    if (!duration) {
      try {
        const embedRes = await fetch(
          `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          }
        );
        if (embedRes.ok) {
          const html = await embedRes.text();
          const match = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
          if (match) {
            const secs = parseInt(match[1]);
            const h = Math.floor(secs / 3600);
            const m = Math.floor((secs % 3600) / 60);
            const s = secs % 60;
            duration = h > 0
              ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
              : `${m}:${String(s).padStart(2, "0")}`;
          }
        }
      } catch (e) {
        console.log("Embed page scrape failed:", e.message);
      }
    }

    console.log(`Video ${videoId}: duration="${duration}"`);

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
