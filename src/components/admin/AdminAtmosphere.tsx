import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, CloudSun, CheckCircle2, XCircle } from "lucide-react";

type AtmosphereSettings = {
  enabled: string;
  seasonal_enabled: string;
  time_override: string;
  season_override: string;
};

const defaults: AtmosphereSettings = {
  enabled: "true",
  seasonal_enabled: "true",
  time_override: "auto",
  season_override: "auto",
};

const AdminAtmosphere = () => {
  const [settings, setSettings] = useState<AtmosphereSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "atmosphere")
      .maybeSingle();
    if (data?.value) {
      const val = data.value as Record<string, string>;
      setSettings({ ...defaults, ...val });
    }
    setLoading(false);
  };

  const update = (field: keyof AtmosphereSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setVerified(null);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "atmosphere", value: settings as any }, { onConflict: "key" });
    setSaving(false);

    if (error) {
      toast.error("Failed to save: " + error.message);
      setVerified(false);
      return;
    }

    // Verification: re-read from DB
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "atmosphere")
      .maybeSingle();

    const saved = data?.value as Record<string, string> | null;
    const ok =
      saved?.enabled === settings.enabled &&
      saved?.seasonal_enabled === settings.seasonal_enabled &&
      saved?.time_override === settings.time_override &&
      saved?.season_override === settings.season_override;

    setVerified(ok);
    if (ok) {
      toast.success("Atmosphere settings saved and verified!");
    } else {
      toast.error("Settings saved but verification failed. Please retry.");
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Atmosphere Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Control the dynamic time & season-based visual effects on the homepage.
        </p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <CloudSun size={20} className="text-primary" />
          <h3 className="font-display font-semibold text-foreground text-lg">Visual Effects</h3>
        </div>

        {/* Toggle: Dynamic Atmosphere */}
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="text-sm font-medium">Enable Dynamic Atmosphere</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Time-based gradients and ambient lighting on the homepage.</p>
          </div>
          <Switch
            checked={settings.enabled === "true"}
            onCheckedChange={(v) => update("enabled", String(v))}
          />
        </div>

        {/* Toggle: Seasonal Effects */}
        <div className="flex items-center justify-between py-2">
          <div>
            <Label className="text-sm font-medium">Enable Seasonal Effects</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Seasonal color tints and animated particles (🌸 ☀️ 🍂 ❄️).</p>
          </div>
          <Switch
            checked={settings.seasonal_enabled === "true"}
            onCheckedChange={(v) => update("seasonal_enabled", String(v))}
          />
        </div>

        {/* Select: Time Override */}
        <div>
          <Label className="text-sm font-medium">Manual Time Override</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">Force a specific time period for testing or override.</p>
          <Select value={settings.time_override} onValueChange={(v) => update("time_override", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (detect from visitor's clock)</SelectItem>
              <SelectItem value="morning">Morning (5 AM – 10 AM)</SelectItem>
              <SelectItem value="noon">Noon (11 AM – 3 PM)</SelectItem>
              <SelectItem value="evening">Evening (4 PM – 6 PM)</SelectItem>
              <SelectItem value="night">Night (7 PM – 4 AM)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Select: Season Override */}
        <div>
          <Label className="text-sm font-medium">Manual Season Override</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">Force a specific season for testing or override.</p>
          <Select value={settings.season_override} onValueChange={(v) => update("season_override", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (detect from month)</SelectItem>
              <SelectItem value="spring">Spring (Mar – May)</SelectItem>
              <SelectItem value="summer">Summer (Jun – Aug)</SelectItem>
              <SelectItem value="autumn">Autumn (Sep – Nov)</SelectItem>
              <SelectItem value="winter">Winter (Dec – Feb)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Save + Verification */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} size="sm" disabled={saving}>
            <Save size={14} className="mr-1" />
            {saving ? "Saving..." : "Save Atmosphere Settings"}
          </Button>
          {verified === true && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <CheckCircle2 size={14} /> Atmosphere system verified and running correctly.
            </span>
          )}
          {verified === false && (
            <span className="flex items-center gap-1 text-xs text-destructive">
              <XCircle size={14} /> Verification failed. Please retry.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAtmosphere;
