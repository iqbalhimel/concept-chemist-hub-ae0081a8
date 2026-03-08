import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ThemeLoader = () => {
  useEffect(() => {
    const loadTheme = async () => {
      const { data } = await supabase
        .from("themes")
        .select("colors")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (data?.colors) {
        const colors = data.colors as Record<string, string>;
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value);
        });
      }
    };

    loadTheme();
  }, []);

  return null;
};

export default ThemeLoader;
