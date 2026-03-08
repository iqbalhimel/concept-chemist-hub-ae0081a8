import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Palette } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Theme = Tables<"themes">;

const AdminThemes = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("themes").select("*").order("name");
    setThemes(data || []);
    setLoading(false);
  };

  const activateTheme = async (id: string) => {
    // Deactivate all, then activate selected
    await supabase.from("themes").update({ is_active: false }).neq("id", "");
    const { error } = await supabase.from("themes").update({ is_active: true }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setThemes(prev => prev.map(t => ({ ...t, is_active: t.id === id })));
    toast.success("Theme activated! Refresh the site to see changes.");
    // Also apply immediately
    const theme = themes.find(t => t.id === id);
    if (theme) applyTheme(theme.colors as Record<string, string>);
  };

  const applyTheme = (colors: Record<string, string>) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  };

  const getPreviewColors = (colors: Record<string, string>) => {
    return {
      bg: `hsl(${colors.background})`,
      primary: `hsl(${colors.primary})`,
      accent: `hsl(${colors.accent})`,
      card: `hsl(${colors.card})`,
    };
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-foreground">Theme Manager</h2>
      <p className="text-muted-foreground">Select a theme to change the entire website's color scheme instantly.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map(theme => {
          const colors = theme.colors as Record<string, string>;
          const preview = getPreviewColors(colors);
          return (
            <div
              key={theme.id}
              className={`glass-card p-4 cursor-pointer transition-all ${theme.is_active ? "ring-2 ring-primary" : "hover:border-primary/40"}`}
              onClick={() => activateTheme(theme.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <Palette size={18} className="text-primary" />
                <span className="font-display font-semibold text-foreground">{theme.label}</span>
                {theme.is_active && <Check size={16} className="text-primary ml-auto" />}
              </div>
              {/* Color preview swatches */}
              <div className="flex gap-2 mb-3">
                {[preview.bg, preview.primary, preview.accent, preview.card].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg border border-border" style={{ backgroundColor: c }} />
                ))}
              </div>
              <Button size="sm" variant={theme.is_active ? "default" : "outline"} className="w-full">
                {theme.is_active ? "Active" : "Activate"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminThemes;
