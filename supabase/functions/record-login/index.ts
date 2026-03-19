import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { device_info, success = true } = body;
    const ip = getIp(req);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if admin
    const { data: isAdmin } = await adminClient.rpc("is_any_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Not an admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert login history
    await adminClient.from("admin_login_history").insert({
      admin_id: user.id,
      ip_address: ip,
      device_info: typeof device_info === "string" ? device_info.slice(0, 500) : null,
      success,
    });

    // Suspicious login detection
    // 1. Check if this IP was seen before this login (exclude the row we just inserted)
    const { count: totalLogins } = await adminClient
      .from("admin_login_history")
      .select("id", { count: "exact", head: true })
      .eq("admin_id", user.id)
      .eq("success", true);

    const { count: seenIpCount } = await adminClient
      .from("admin_login_history")
      .select("id", { count: "exact", head: true })
      .eq("admin_id", user.id)
      .eq("ip_address", ip)
      .eq("success", true);

    // isNewIp: user has more than 1 successful login total, and this IP has only
    // appeared once (the row we just inserted — i.e., never seen before).
    const isNewIp = (totalLogins ?? 0) > 1 && (seenIpCount ?? 0) <= 1;

    // 2. Check for new device
    let isNewDevice = false;
    if (device_info) {
      const { count: deviceCount } = await adminClient
        .from("admin_login_history")
        .select("id", { count: "exact", head: true })
        .eq("admin_id", user.id)
        .eq("device_info", device_info)
        .eq("success", true);
      isNewDevice = (totalLogins ?? 0) > 1 && (deviceCount ?? 0) <= 1;
    }

    // 3. Check recent failed attempts
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: failedCount } = await adminClient
      .from("admin_login_history")
      .select("id", { count: "exact", head: true })
      .eq("admin_id", user.id)
      .eq("success", false)
      .gte("login_time", fiveMinAgo);

    const suspicious: string[] = [];
    if (isNewIp) suspicious.push("new_ip");
    if (isNewDevice) suspicious.push("new_device");
    if ((failedCount ?? 0) >= 3) suspicious.push("multiple_failed_attempts");

    if (suspicious.length > 0) {
      await adminClient.from("security_logs").insert({
        event_type: "suspicious_login",
        description: `Suspicious login detected: ${suspicious.join(", ")}`,
        user_id: user.id,
        user_email: user.email,
        ip_address: ip,
        metadata: { severity: "high", reasons: suspicious, device_info },
      });
    }

    return new Response(JSON.stringify({ success: true, suspicious }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("record-login error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
