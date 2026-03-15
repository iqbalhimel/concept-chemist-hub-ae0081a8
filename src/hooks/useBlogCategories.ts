import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slugify";

export interface CategoryMeta {
  name: string;
  slug: string;
  color: string;
  order: number;
}

/**
 * Hook to fetch managed blog categories from site_settings.
 * Falls back to extracting unique categories from blog_posts.
 * Returns enriched category metadata (slug, color, order).
 */
export function useBlogCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryMeta, setCategoryMeta] = useState<CategoryMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "blog_categories")
        .maybeSingle();

      const { data: posts } = await supabase
        .from("blog_posts")
        .select("category");

      const postCats = [...new Set((posts || []).map(p => p.category))];

      let managed: CategoryMeta[] = [];
      if (settingsData?.value && Array.isArray(settingsData.value)) {
        managed = (settingsData.value as any[]).map((c: any, i: number) => ({
          name: String(c.name || c),
          slug: c.slug || slugify(String(c.name || c)),
          color: c.color || "",
          order: c.order ?? c.sort_order ?? i,
        }));
      }

      // Merge unmanaged post categories
      const managedSet = new Set(managed.map(c => c.name));
      postCats.forEach(cat => {
        if (!managedSet.has(cat)) {
          managed.push({ name: cat, slug: slugify(cat), color: "", order: managed.length });
        }
      });

      managed.sort((a, b) => a.order - b.order);
      setCategoryMeta(managed);
      setCategories(managed.map(c => c.name));
      setLoading(false);
    };
    load();
  }, []);

  return { categories, categoryMeta, loading };
}
