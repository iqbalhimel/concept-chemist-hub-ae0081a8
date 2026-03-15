import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch managed blog categories from site_settings.
 * Falls back to extracting unique categories from blog_posts.
 */
export function useBlogCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Try managed list first
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "blog_categories")
        .maybeSingle();

      let managed: string[] = [];
      if (settingsData?.value && Array.isArray(settingsData.value)) {
        managed = (settingsData.value as any[]).map((c: any) => String(c.name || c));
      }

      // Also get unique categories from posts to ensure completeness
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("category");

      const postCats = [...new Set((posts || []).map(p => p.category))];

      // Merge: managed list first, then any post categories not in managed
      const managedSet = new Set(managed);
      const merged = [...managed];
      postCats.forEach(cat => {
        if (!managedSet.has(cat)) merged.push(cat);
      });

      setCategories(merged);
      setLoading(false);
    };
    load();
  }, []);

  return { categories, loading };
}
