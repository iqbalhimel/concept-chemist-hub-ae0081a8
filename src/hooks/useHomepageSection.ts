import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type HomepageSectionRow = Tables<"homepage_sections">;

export function useHomepageSection(sectionKey: string) {
  return useQuery({
    queryKey: ["homepage_section", sectionKey],
    queryFn: async (): Promise<HomepageSectionRow | null> => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (error) throw error;
      return (data as HomepageSectionRow) ?? null;
    },
    // Keep UI responsive; admin will invalidate after save
    staleTime: 1000 * 60 * 5,
  });
}

