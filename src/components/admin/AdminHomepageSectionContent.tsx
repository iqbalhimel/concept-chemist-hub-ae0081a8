import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Home, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import { useHomepageSection } from "@/hooks/useHomepageSection";
import { useQueryClient } from "@tanstack/react-query";
import { logAdminActivity } from "@/lib/activityLogger";

const SECTION_KEY = "recommended";

type FormState = {
  title_en: string;
  title_bn: string;
  subtitle_en: string;
  subtitle_bn: string;
  badge_en: string;
  badge_bn: string;
  is_active: boolean;
};

const AdminHomepageSectionContent = () => {
  const csrfGuard = useCsrfGuard();
  const qc = useQueryClient();
  const { data, isLoading } = useHomepageSection(SECTION_KEY);
  const [saving, setSaving] = useState(false);

  const initial = useMemo<FormState>(() => ({
    title_en: data?.title_en ?? "",
    title_bn: data?.title_bn ?? "",
    subtitle_en: data?.subtitle_en ?? "",
    subtitle_bn: data?.subtitle_bn ?? "",
    badge_en: data?.badge_en ?? "",
    badge_bn: data?.badge_bn ?? "",
    is_active: data?.is_active ?? true,
  }), [data]);

  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await csrfGuard(async () => {
      const payload = {
        section_key: SECTION_KEY,
        title_en: form.title_en || null,
        title_bn: form.title_bn || null,
        subtitle_en: form.subtitle_en || null,
        subtitle_bn: form.subtitle_bn || null,
        badge_en: form.badge_en || null,
        badge_bn: form.badge_bn || null,
        is_active: form.is_active,
      };

      const { error } = await supabase
        .from("homepage_sections")
        .upsert(payload, { onConflict: "section_key" });

      if (error) {
        toast.error("Failed to save: " + error.message);
      } else {
        // Immediate reflection on homepage without reload
        await qc.invalidateQueries({ queryKey: ["homepage_section", SECTION_KEY] });
        toast.success("Homepage section content saved");
        logAdminActivity({ action: "update_settings", module: "homepage_sections", itemTitle: "Recommended Section" });
      }
    });
    setSaving(false);
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Home size={22} className="text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">Homepage · Section Content</h2>
        </div>
        <p className="text-muted-foreground text-sm">Edit the Recommended section copy shown on the homepage (EN/BN).</p>
      </div>

      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center justify-between py-1">
          <Label className="font-medium">Active</Label>
          <Switch checked={form.is_active} onCheckedChange={(v) => update("is_active", v)} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Badge (EN)</Label>
            <Input value={form.badge_en} onChange={(e) => update("badge_en", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Badge (BN)</Label>
            <Input value={form.badge_bn} onChange={(e) => update("badge_bn", e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>Title (EN)</Label>
            <Input value={form.title_en} onChange={(e) => update("title_en", e.target.value)} className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Tip: use `|` to split highlighted text (e.g. `Recommended for |Students`).</p>
          </div>
          <div>
            <Label>Title (BN)</Label>
            <Input value={form.title_bn} onChange={(e) => update("title_bn", e.target.value)} className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">টিপ: হাইলাইট অংশ আলাদা করতে `|` ব্যবহার করুন।</p>
          </div>

          <div className="md:col-span-2">
            <Label>Subtitle (EN)</Label>
            <Textarea value={form.subtitle_en} onChange={(e) => update("subtitle_en", e.target.value)} className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <Label>Subtitle (BN)</Label>
            <Textarea value={form.subtitle_bn} onChange={(e) => update("subtitle_bn", e.target.value)} className="mt-1" />
          </div>
        </div>

        <Button onClick={handleSave} className="mt-1" disabled={saving}>
          {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AdminHomepageSectionContent;

