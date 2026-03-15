import { supabase } from "@/integrations/supabase/client";

/**
 * Track a content view/download. Fire-and-forget — never blocks UI.
 */
export const trackContentView = (contentType: "blog_post" | "study_material" | "video", contentId: string) => {
  (supabase.rpc as any)("increment_view_count", {
    p_content_type: contentType,
    p_content_id: contentId,
  }).then(() => {});
};
