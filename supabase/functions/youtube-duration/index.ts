import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    if (!videoId || typeof videoId !== "string") {
      return new Response(JSON.stringify({ error: "Missing videoId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the YouTube watch page server-side to extract duration
    const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch YouTube page" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await res.text();

    // Extract lengthSeconds from ytInitialPlayerResponse
    let duration = "";
    const lengthMatch = html.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
    if (lengthMatch) {
      const totalSeconds = parseInt(lengthMatch[1]);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;
      if (h > 0) {
        duration = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      } else {
        duration = `${m}:${String(s).padStart(2, "0")}`;
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
