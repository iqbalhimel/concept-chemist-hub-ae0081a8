import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify caller is authenticated admin
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

    // Verify the caller using their JWT
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller has admin/super_admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRole } = await adminClient.rpc("get_admin_role", { _user_id: caller.id });
    if (callerRole !== "super_admin") {
      return new Response(JSON.stringify({ error: "Forbidden: only Super Admin can invite" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { email, name, role } = await req.json();
    if (!email || !role) {
      return new Response(JSON.stringify({ error: "Email and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validRoles = ["super_admin", "admin", "editor", "moderator"];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Invite user via admin API
    // Try to invite the user; if they already exist, look them up instead
    let newUserId: string;

    const originHeader = req.headers.get("origin");
    const siteUrl = Deno.env.get("SITE_URL") || originHeader || Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".app");
    const redirectTo = `${siteUrl}/reset-password`;

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo,
    });

    if (inviteError) {
      // If user already exists, find them by email and send a notification
      if (inviteError.message.includes("already been registered")) {
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) {
          return new Response(JSON.stringify({ error: listError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const existingUser = users.find((u: any) => u.email === email);
        if (!existingUser) {
          return new Response(JSON.stringify({ error: "User not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        newUserId = existingUser.id;

        // Send a password reset / magic link so the existing user gets an email notification
        await adminClient.auth.resetPasswordForEmail(email, {
          redirectTo,
        });
      } else {
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      newUserId = inviteData.user.id;
    }

    // Create profile
    await adminClient.from("profiles").upsert({
      user_id: newUserId,
      name: name || "",
    }, { onConflict: "user_id" });

    // Assign role
    await adminClient.from("user_roles").upsert({
      user_id: newUserId,
      role: role,
    }, { onConflict: "user_id,role" });

    return new Response(JSON.stringify({ success: true, user_id: newUserId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("invite-admin error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
