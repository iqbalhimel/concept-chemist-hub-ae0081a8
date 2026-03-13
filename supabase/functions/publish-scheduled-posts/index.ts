import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set<string>([
  "https://iqbalsir.bd",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const IP_WINDOW_MS = 300_000;
const IP_MAX_REQUESTS = 5;

const ipWindow = new Map<string, { count: number; windowStart: number }>();

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

function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(ip: string, now: number): boolean {
  const entry = ipWindow.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > IP_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  ipWindow.set(ip, entry);
  return entry.count > IP_MAX_REQUESTS;
}

Deno.serve(async (req) => {
  const baseHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: baseHeaders });
  }

  // This function is intended to run from a trusted scheduler, not from browsers.
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const ip = getIp(req);
    const now = Date.now();
    if (checkRateLimit(ip, now)) {
      console.warn("[publish-scheduled-posts] Rate limit exceeded for ip:", ip);
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("blog_posts")
      .update({ is_published: true, scheduled_at: null })
      .eq("is_published", false)
      .not("scheduled_at", "is", null)
      .lte("scheduled_at", now)
      .select("id, title");

    if (error) throw error;

    return new Response(
      JSON.stringify({ published: data?.length || 0, posts: data }),
      { headers: { ...baseHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });
  }
});
