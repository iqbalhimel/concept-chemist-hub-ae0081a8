import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Palette } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";

type Theme = Tables<"themes">;

const AdminThemes = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("themes").select("*").order("name");
    setThemes(data || []);
    setLoading(false);
  };

  const applyTheme = (colors: Record<string, string>) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  };

  const activateTheme = async (id: string) => {
    setActivating(id);
    // Deactivate all, then activate selected
    await supabase.from("themes").update({ is_active: false }).neq("id", id);
    const { error } = await supabase.from("themes").update({ is_active: true }).eq("id", id);
    if (error) { toast.error(error.message); setActivating(null); return; }

    // Apply instantly
    const theme = themes.find(t => t.id === id);
    if (theme) applyTheme(theme.colors as Record<string, string>);

    setThemes(prev => prev.map(t => ({ ...t, is_active: t.id === id })));
    setActivating(null);
    toast.success("Theme activated! Applied across the entire site.");
  };

  const getPreviewColors = (colors: Record<string, string>) => ({
    bg: `hsl(${colors.background})`,
    primary: `hsl(${colors.primary})`,
    accent: `hsl(${colors.accent})`,
    card: `hsl(${colors.card})`,
  });

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-foreground">Theme Manager</h2>
      <p className="text-muted-foreground text-sm">Select a theme to change the entire website's color scheme instantly. Changes apply to both frontend and admin panel in real-time.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map(theme => {
          const colors = theme.colors as Record<string, string>;
          const preview = getPreviewColors(colors);
          const isActivating = activating === theme.id;
          return (
            <div
              key={theme.id}
              className={`glass-card p-4 cursor-pointer transition-all ${theme.is_active ? "ring-2 ring-primary" : "hover:border-primary/40"}`}
              onClick={() => !isActivating && activateTheme(theme.id)}
            >
              <div className="flex items-center gap-2 mb-3">
                <Palette size={18} className="text-primary" />
                <span className="font-display font-semibold text-foreground">{theme.label}</span>
                {theme.is_active && <Check size={16} className="text-primary ml-auto" />}
              </div>
              <div className="flex gap-2 mb-3">
                {[preview.bg, preview.primary, preview.accent, preview.card].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-lg border border-border" style={{ backgroundColor: c }} />
                ))}
              </div>
              <Button size="sm" variant={theme.is_active ? "default" : "outline"} className="w-full" disabled={isActivating}>
                {isActivating ? "Applying..." : theme.is_active ? "Active" : "Activate"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminThemes;
