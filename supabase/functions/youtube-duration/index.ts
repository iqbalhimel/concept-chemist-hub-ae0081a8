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
    const debug: string[] = [];

    // Test 1: Piped API
    try {
      const res = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
      debug.push(`piped: status=${res.status}`);
      if (res.ok) {
        const text = await res.text();
        debug.push(`piped body length: ${text.length}`);
        try {
          const data = JSON.parse(text);
          debug.push(`piped duration: ${data.duration}`);
          if (data.duration > 0) {
            const h = Math.floor(data.duration / 3600);
            const m = Math.floor((data.duration % 3600) / 60);
            const s = data.duration % 60;
            const dur = h > 0
              ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
              : `${m}:${String(s).padStart(2, "0")}`;
            return new Response(JSON.stringify({ duration: dur, debug }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (e) {
          debug.push(`piped parse error: ${e.message}`);
        }
      }
    } catch (e) {
      debug.push(`piped error: ${e.message}`);
    }

    // Test 2: Invidious
    try {
      const res = await fetch(`https://inv.nadeko.net/api/v1/videos/${videoId}?fields=lengthSeconds`);
      debug.push(`inv: status=${res.status}`);
      if (res.ok) {
        const data = await res.json();
        debug.push(`inv lengthSeconds: ${data.lengthSeconds}`);
      }
    } catch (e) {
      debug.push(`inv error: ${e.message}`);
    }

    // Test 3: YouTube internal API
    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          context: { client: { clientName: "ANDROID", clientVersion: "19.09.37", androidSdkVersion: 30, hl: "en" } },
        }),
      });
      debug.push(`ytapi: status=${res.status}`);
      if (res.ok) {
        const data = await res.json();
        debug.push(`ytapi lengthSeconds: ${data?.videoDetails?.lengthSeconds}`);
      }
    } catch (e) {
      debug.push(`ytapi error: ${e.message}`);
    }

    return new Response(JSON.stringify({ duration: "", debug }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
