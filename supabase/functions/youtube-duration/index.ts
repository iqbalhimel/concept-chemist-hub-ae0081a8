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

    let duration = "";

    // Approach 1: Scrape the YouTube watch page for lengthSeconds
    if (!duration) {
      try {
        const res = await fetch(
          `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
              "Accept-Language": "en-US,en;q=0.9",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              Cookie: "CONSENT=PENDING+987; SOCS=CAESEwgDEgk2ODE4MTYwODgaAmVuIAEaBgiA_LyuBg",
            },
          }
        );
        if (res.ok) {
          const html = await res.text();
          // Try multiple patterns
          const patterns = [
            /"lengthSeconds"\s*:\s*"(\d+)"/,
            /lengthSeconds\\?":\s*\\?"(\d+)/,
            /"approxDurationMs"\s*:\s*"(\d+)"/,
          ];
          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) {
              let secs: number;
              if (pattern === patterns[2]) {
                // approxDurationMs
                secs = Math.floor(parseInt(match[1]) / 1000);
              } else {
                secs = parseInt(match[1]);
              }
              if (secs > 0) {
                duration = formatDuration(secs);
                break;
              }
            }
          }
        }
      } catch (_) { /* skip */ }
    }

    // Approach 2: YouTube embed page (lighter, may have duration)
    if (!duration) {
      try {
        const res = await fetch(
          `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            },
          }
        );
        if (res.ok) {
          const html = await res.text();
          const match = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
          if (match) {
            const secs = parseInt(match[1]);
            if (secs > 0) {
              duration = formatDuration(secs);
            }
          }
        }
      } catch (_) { /* skip */ }
    }

    // Approach 3: Try multiple Piped instances
    if (!duration) {
      const pipedInstances = [
        "https://pipedapi.r4fo.com",
        "https://pipedapi.adminforge.de",
        "https://api.piped.privacydev.net",
      ];
      for (const instance of pipedInstances) {
        if (duration) break;
        try {
          const controller = new AbortController();
          const tid = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${instance}/streams/${encodeURIComponent(videoId)}`, {
            signal: controller.signal,
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
