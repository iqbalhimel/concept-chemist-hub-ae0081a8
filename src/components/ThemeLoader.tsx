import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrightness } from "@/contexts/BrightnessContext";

const applyTheme = (colors: Record<string, string>) => {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
};

const ThemeLoader = () => {
  const { mode } = useBrightness();

  const loadTheme = useCallback(async () => {
    const { data } = await supabase
      .from("themes")
      .select("colors, colors_light")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (data) {
      const colors = mode === "light" && data.colors_light && Object.keys(data.colors_light as Record<string, string>).length > 0
        ? (data.colors_light as Record<string, string>)
        : (data.colors as Record<string, string>);
      if (colors) applyTheme(colors);
    }
  }, [mode]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    const channel = supabase
      .channel("theme-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "themes" },
        (payload) => {
          if (payload.new?.is_active) {
            const colors = mode === "light" && payload.new?.colors_light && Object.keys(payload.new.colors_light as Record<string, string>).length > 0
              ? (payload.new.colors_light as Record<string, string>)
              : (payload.new?.colors as Record<string, string>);
            if (colors) applyTheme(colors);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mode]);

  return null;
};

export default ThemeLoader;
