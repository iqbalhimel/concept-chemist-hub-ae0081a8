import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set<string>([
  "https://iqbalsir.bd",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
  const baseHeaders = buildCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: baseHeaders });
  }

  try {
    // Require a valid Supabase JWT so only calls coming through Supabase clients are accepted
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const { event_type, description, user_email, user_id, metadata } = await req.json();

    if (!event_type || typeof event_type !== "string" || event_type.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid event_type" }), {
        status: 400,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    const safeDescription =
      typeof description === "string" ? description.slice(0, 1024) : "";
    const safeUserEmail =
      typeof user_email === "string" && user_email.length <= 255 ? user_email : null;
    const safeUserId =
      typeof user_id === "string" && user_id.length <= 255 ? user_id : null;

    let safeMetadata: Record<string, unknown> = {};
    if (metadata && typeof metadata === "object") {
      try {
        const json = JSON.stringify(metadata);
        if (json.length <= 4000) {
          safeMetadata = metadata as Record<string, unknown>;
        }
      } catch {
        // ignore malformed metadata
      }
    }

    // Extract IP from headers
    const ip_address =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error } = await supabase.from("security_logs").insert({
      event_type,
      description: safeDescription,
      ip_address,
      user_email: safeUserEmail,
      user_id: safeUserId,
      metadata: safeMetadata,
    });

    if (error) {
      console.error("Failed to insert security log:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...baseHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...baseHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Security log error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...buildCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
