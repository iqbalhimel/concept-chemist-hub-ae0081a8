import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from "lucide-react";

const settingsKeys = [
  { key: "hero", label: "Hero Section", fields: ["title", "subtitle", "tagline", "cta_text", "cta_link"] },
  { key: "about", label: "About Section", fields: ["heading", "description", "highlights"] },
  { key: "contact", label: "Contact Details", fields: ["phone", "whatsapp", "email", "address", "map_embed_url"] },
  { key: "social", label: "Social Links", fields: ["facebook", "whatsapp_link", "email_link"] },
];

const AdminSiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("*");
    const mapped: Record<string, Record<string, string>> = {};
    data?.forEach(row => {
      mapped[row.key] = row.value as Record<string, string>;
    });
    setSettings(mapped);
    setLoading(false);
  };

  const handleSave = async (key: string) => {
    const value = settings[key] || {};
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success(`${key} settings saved!`);
    }
  };

  const updateField = (section: string, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value },
    }));
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-8">
      <h2 className="font-display text-2xl font-bold text-foreground">Site Settings</h2>
      {settingsKeys.map(section => (
        <div key={section.key} className="glass-card p-6">
          <h3 className="font-display font-semibold text-foreground text-lg mb-4">{section.label}</h3>
          <div className="space-y-3">
            {section.fields.map(field => (
              <div key={field}>
                <Label className="capitalize">{field.replace(/_/g, " ")}</Label>
                {field === "description" || field === "highlights" ? (
                  <Textarea
                    value={settings[section.key]?.[field] || ""}
                    onChange={e => updateField(section.key, field, e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <Input
                    value={settings[section.key]?.[field] || ""}
                    onChange={e => updateField(section.key, field, e.target.value)}
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>
          <Button onClick={() => handleSave(section.key)} className="mt-4" size="sm">
            <Save size={14} className="mr-1" /> Save {section.label}
          </Button>
        </div>
      ))}
    </div>
  );
};

export default AdminSiteSettings;
