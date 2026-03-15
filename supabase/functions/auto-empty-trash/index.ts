import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TABLES_WITH_TRASH = [
  "blog_posts",
  "notices",
  "study_materials",
  "testimonials",
  "gallery",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const results: Record<string, number> = {};

    for (const table of TABLES_WITH_TRASH) {
      // For gallery, clean up storage files first
      if (table === "gallery") {
        const { data: oldItems } = await supabase
          .from(table)
          .select("id, image_url")
          .not("trashed_at", "is", null)
          .lt("trashed_at", thirtyDaysAgo);

        if (oldItems?.length) {
          const paths = oldItems
            .map((item: any) => {
              const parts = item.image_url?.split("/media/");
              return parts?.[1] || null;
            })
            .filter(Boolean);

          if (paths.length) {
            await supabase.storage.from("media").remove(paths);
          }
        }
      }

      const { data } = await supabase
        .from(table)
        .delete()
        .not("trashed_at", "is", null)
        .lt("trashed_at", thirtyDaysAgo)
        .select("id");

      results[table] = data?.length ?? 0;
    }

    return new Response(JSON.stringify({ success: true, deleted: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
