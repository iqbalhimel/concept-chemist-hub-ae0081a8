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

    const debug: string[] = [];
    let duration = "";

    // Approach 1: YouTube watch page
    try {
      const res = await fetch(
        `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
            Cookie: "CONSENT=PENDING+987; SOCS=CAESEwgDEgk2ODE4MTYwODgaAmVuIAEaBgiA_LyuBg",
          },
        }
      );
      debug.push(`watch: status=${res.status}, size=${res.headers.get("content-length") || "unknown"}`);
      if (res.ok) {
        const html = await res.text();
        debug.push(`watch html length: ${html.length}`);
        
        // Check for lengthSeconds
        const idx = html.indexOf("lengthSeconds");
        if (idx >= 0) {
          debug.push(`found lengthSeconds at index ${idx}: ${html.substring(idx, idx + 40)}`);
          const match = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
          if (match) {
            const secs = parseInt(match[1]);
            if (secs > 0) {
              duration = formatDuration(secs);
              debug.push(`duration from watch: ${duration}`);
            }
          }
        } else {
          debug.push("lengthSeconds NOT found in HTML");
          // Check if it's a consent page
          if (html.includes("consent")) {
            debug.push("consent page detected");
          }
          // Sample a bit of the page
          debug.push(`html start: ${html.substring(0, 200).replace(/\n/g, " ")}`);
        }
      }
    } catch (e) {
      debug.push(`watch error: ${e.message}`);
    }

    return new Response(JSON.stringify({ duration, debug }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
