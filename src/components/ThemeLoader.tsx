import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const applyTheme = (colors: Record<string, string>) => {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
};

const ThemeLoader = () => {
  const loadTheme = useCallback(async () => {
    const { data } = await supabase
      .from("themes")
      .select("colors")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (data?.colors) {
      applyTheme(data.colors as Record<string, string>);
    }
  }, []);

  useEffect(() => {
    loadTheme();

    // Listen for realtime theme changes
    const channel = supabase
      .channel("theme-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "themes" },
        (payload) => {
          if (payload.new?.is_active && payload.new?.colors) {
            applyTheme(payload.new.colors as Record<string, string>);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadTheme]);

  return null;
};

export default ThemeLoader;
