import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import { compressImage } from "@/lib/imageCompression";
import { secureUpload } from "@/lib/secureUpload";
import { invalidateSiteSettings } from "@/hooks/useSiteSettings";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "toggle" | "select" | "image" | "range";
  options?: { value: string; label: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};

export type SectionConfig = {
  key: string;
  label: string;
  icon: React.ElementType;
  fields: FieldDef[];
  description?: string;
};

interface Props {
  section: SectionConfig;
}

const AdminSettingsSection = ({ section }: Props) => {
  const csrfGuard = useCsrfGuard();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", section.key).maybeSingle();
      setSettings((data?.value as Record<string, string>) || {});
      setLoading(false);
    };
    fetch();
  }, [section.key]);

  const handleSave = async () => {
    setSaving(true);
    await csrfGuard(async () => {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: section.key, value: settings }, { onConflict: "key" });
      if (error) {
        toast.error("Failed to save: " + error.message);
      } else {
        invalidateSiteSettings();
        toast.success(`${section.label} saved!`);
      }
    });
    setSaving(false);
  };

  const update = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (fieldName: string, file: File) => {
    setUploading(fieldName);
    try {
      let fileToUpload: File | Blob = file;
      let contentType = file.type;
      if (file.type.startsWith("image/") && file.size > 200 * 1024) {
        const compressed = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 80 });
        fileToUpload = compressed.blob;
        contentType = compressed.contentType;
      }
      const { publicUrl } = await secureUpload(fileToUpload, contentType, file.name, { directory: "settings" });
      update(fieldName, publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    }
    setUploading(null);
  };

  const renderField = (field: FieldDef) => {
    const value = settings[field.name] || "";

    switch (field.type) {
      case "toggle":
        return (
          <div className="flex items-center justify-between py-2">
            <Label>{field.label}</Label>
            <Switch checked={value === "true"} onCheckedChange={(checked) => update(field.name, String(checked))} />
          </div>
        );
      case "select":
        return (
          <div>
            <Label>{field.label}</Label>
            <Select value={value} onValueChange={(v) => update(field.name, v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "image":
        return (
          <div>
            <Label>{field.label}</Label>
            <div className="flex items-center gap-3 mt-1">
              <Input value={value} onChange={e => update(field.name, e.target.value)} placeholder="URL or upload..." className="flex-1" />
              <input type="file" accept="image/*" className="hidden" ref={(el) => { fileInputRefs.current[field.name] = el; }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(field.name, f); }} />
              <Button type="button" variant="outline" size="sm" disabled={uploading === field.name}
                onClick={() => fileInputRefs.current[field.name]?.click()}>
                <Upload size={14} className="mr-1" />
                {uploading === field.name ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {value && <img src={value} alt="Preview" className="mt-2 h-16 rounded-md border border-border object-contain" />}
          </div>
        );
      case "range":
        return (
          <div>
            <Label>{field.label}: <span className="text-primary font-mono">{value || field.min || 0}</span></Label>
            <Slider value={[Number(value) || field.min || 0]} min={field.min ?? 0} max={field.max ?? 100} step={field.step ?? 1}
              onValueChange={(v) => update(field.name, String(v[0]))} className="mt-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{field.min ?? 0}</span><span>{field.max ?? 100}</span>
            </div>
          </div>
        );
      case "textarea":
        return (
          <div>
            <Label>{field.label}</Label>
            <Textarea value={value} onChange={e => update(field.name, e.target.value)} placeholder={field.placeholder} className="mt-1" />
          </div>
        );
      default:
        return (
          <div>
            <Label>{field.label}</Label>
            <Input value={value} onChange={e => update(field.name, e.target.value)} placeholder={field.placeholder} className="mt-1" />
          </div>
        );
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  const Icon = section.icon;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon size={22} className="text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">{section.label}</h2>
        </div>
        {section.description && <p className="text-muted-foreground text-sm">{section.description}</p>}
      </div>
      <div className="glass-card p-6 space-y-4">
        {section.fields.map(field => (
          <div key={field.name}>{renderField(field)}</div>
        ))}
        <Button onClick={handleSave} className="mt-2" size="sm" disabled={saving}>
          <Save size={14} className="mr-1" />
          {saving ? "Saving..." : `Save ${section.label}`}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettingsSection;
