import { supabase } from "@/integrations/supabase/client";

export type ActivityAction = "create" | "edit" | "delete" | "bulk_delete" | "upload" | "update_settings" | "update_seo";

export type ActivityModule =
  | "blog_posts" | "notices" | "study_materials" | "educational_videos"
  | "gallery" | "testimonials" | "faq" | "media_library"
  | "subjects" | "achievements" | "experience" | "education"
  | "professional_training" | "teaching_approach" | "themes"
  | "site_settings" | "seo" | "blog_categories" | "tags" | "homepage_sections";

interface LogParams {
  action: ActivityAction;
  module: ActivityModule;
  itemId?: string;
  itemTitle?: string;
}

export const logAdminActivity = async ({ action, module, itemId, itemTitle }: LogParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase as any).from("admin_activity_log").insert({
      user_id: user.id,
      action_type: action,
      module,
      item_id: itemId || null,
      item_title: itemTitle || null,
    });
  } catch {
    // Silent fail — activity logging should never block admin actions
  }
};
