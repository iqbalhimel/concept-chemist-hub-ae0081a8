import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Upload, Globe, Search, Bell, MessageCircle, FileText, Settings2 } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";

type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "toggle" | "select" | "image";
  options?: { value: string; label: string }[];
  placeholder?: string;
};

type SectionDef = {
  key: string;
  label: string;
  icon: React.ElementType;
  fields: FieldDef[];
};

const sections: SectionDef[] = [
  {
    key: "site_info",
    label: "Site Information",
    icon: Settings2,
    fields: [
      { name: "site_name", label: "Site Name", type: "text", placeholder: "Iqbal Sir" },
      { name: "site_tagline", label: "Site Tagline", type: "text", placeholder: "Science Teacher in Kishoreganj" },
      { name: "logo_url", label: "Logo Upload", type: "image" },
      { name: "favicon_url", label: "Favicon Upload", type: "image" },
      { name: "default_theme", label: "Default Theme", type: "select", options: [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }] },
      { name: "default_language", label: "Default Language", type: "select", options: [{ value: "en", label: "English" }, { value: "bn", label: "Bangla" }] },
    ],
  },
  {
    key: "homepage_sections",
    label: "Homepage Sections",
    icon: Globe,
    fields: [
      { name: "show_hero", label: "Show Hero Section", type: "toggle" },
      { name: "show_about", label: "Show About Section", type: "toggle" },
      { name: "show_subjects", label: "Show Subjects Section", type: "toggle" },
      { name: "show_approach", label: "Show Approach Section", type: "toggle" },
      { name: "show_stats", label: "Show Stats Section", type: "toggle" },
      { name: "show_gallery", label: "Show Gallery Section", type: "toggle" },
      { name: "show_testimonials", label: "Show Testimonials Section", type: "toggle" },
      { name: "show_experience", label: "Show Experience Section", type: "toggle" },
      { name: "show_education", label: "Show Education Section", type: "toggle" },
      { name: "show_notices", label: "Show Notices Section", type: "toggle" },
      { name: "show_resources", label: "Show Download Center Section", type: "toggle" },
      { name: "show_blog", label: "Show Blog Section", type: "toggle" },
      { name: "show_faq", label: "Show FAQ Section", type: "toggle" },
      { name: "show_contact", label: "Show Contact Section", type: "toggle" },
    ],
  },
  {
    key: "coaching",
    label: "Coaching Information",
    icon: Globe,
    fields: [
      { name: "location", label: "Coaching Location", type: "text", placeholder: "Kishoreganj, Bangladesh" },
      { name: "class_days", label: "Class Days", type: "text", placeholder: "Saturday – Thursday" },
      { name: "class_time", label: "Class Time", type: "text", placeholder: "4:00 PM – 8:00 PM" },
      { name: "batch_size", label: "Batch Size", type: "text", placeholder: "20 students per batch" },
      { name: "target_students", label: "Target Students", type: "text", placeholder: "SSC / HSC" },
      { name: "medium", label: "Medium", type: "select", options: [{ value: "bangla", label: "Bangla" }, { value: "english", label: "English" }, { value: "both", label: "Bangla & English" }] },
    ],
  },
  {
    key: "seo",
    label: "SEO Settings",
    icon: Search,
    fields: [
      { name: "meta_title", label: "Meta Title", type: "text", placeholder: "Iqbal Sir – Science Teacher" },
      { name: "meta_description", label: "Meta Description", type: "textarea", placeholder: "Best science teacher in Kishoreganj..." },
      { name: "meta_keywords", label: "Meta Keywords", type: "text", placeholder: "science, teacher, kishoreganj" },
      { name: "og_title", label: "Open Graph Title", type: "text" },
      { name: "og_description", label: "Open Graph Description", type: "textarea" },
      { name: "og_image", label: "Open Graph Image", type: "image" },
      { name: "ga_id", label: "Google Analytics ID", type: "text", placeholder: "G-XXXXXXXXXX" },
      { name: "gsc_code", label: "Google Search Console Verification Code", type: "text" },
    ],
  },
  {
    key: "announcement",
    label: "Announcement Bar",
    icon: Bell,
    fields: [
      { name: "enabled", label: "Enable Announcement", type: "toggle" },
      { name: "text", label: "Announcement Text", type: "text", placeholder: "New batch starting soon!" },
      { name: "link", label: "Announcement Link", type: "text", placeholder: "https://..." },
    ],
  },
  {
    key: "whatsapp",
    label: "WhatsApp Chat",
    icon: MessageCircle,
    fields: [
      { name: "enabled", label: "Enable WhatsApp Chat", type: "toggle" },
      { name: "number", label: "WhatsApp Number", type: "text", placeholder: "+880XXXXXXXXXX" },
      { name: "default_message", label: "Default Message", type: "text", placeholder: "Hello! I want to know about classes." },
    ],
  },
  {
    key: "footer",
    label: "Footer Settings",
    icon: FileText,
    fields: [
      { name: "description", label: "Footer Description", type: "textarea" },
      { name: "email", label: "Footer Email", type: "text" },
      { name: "phone", label: "Footer Phone", type: "text" },
      { name: "address", label: "Footer Address", type: "textarea" },
      { name: "copyright", label: "Copyright Text", type: "text", placeholder: "© 2025 Iqbal Sir. All rights reserved." },
    ],
  },
  {
    key: "hero",
    label: "Hero Section",
    icon: Globe,
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "cta_text", label: "CTA Text", type: "text" },
      { name: "cta_link", label: "CTA Link", type: "text" },
    ],
  },
  {
    key: "contact",
    label: "Contact Details",
    icon: MessageCircle,
    fields: [
      { name: "phone", label: "Phone", type: "text" },
      { name: "whatsapp", label: "WhatsApp", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "address", label: "Address", type: "textarea" },
      { name: "map_embed_url", label: "Map Embed URL", type: "text" },
    ],
  },
  {
    key: "social",
    label: "Social Links",
    icon: Globe,
    fields: [
      { name: "facebook", label: "Facebook", type: "text" },
      { name: "whatsapp_link", label: "WhatsApp Link", type: "text" },
      { name: "email_link", label: "Email Link", type: "text" },
    ],
  },
];

const AdminSiteSettings = () => {
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
    setSaving(key);
    const value = settings[key] || {};
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });
    setSaving(null);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success(`${sections.find(s => s.key === key)?.label || key} saved!`);
    }
  };

  const updateField = (section: string, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [field]: value },
    }));
  };

  const handleImageUpload = async (sectionKey: string, fieldName: string, file: File) => {
    const uploadKey = `${sectionKey}_${fieldName}`;
    setUploading(uploadKey);
    try {
      let fileToUpload: File | Blob = file;
      if (file.type.startsWith("image/") && file.size > 200 * 1024) {
        const { blob } = await compressImage(file, 1200, 1200, 0.8);
        fileToUpload = blob;
      }
      const ext = file.name.split(".").pop();
      const path = `settings/${sectionKey}-${fieldName}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, fileToUpload);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      updateField(sectionKey, fieldName, urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    }
    setUploading(null);
  };

  const renderField = (section: SectionDef, field: FieldDef) => {
    const value = settings[section.key]?.[field.name] || "";
    const uploadKey = `${section.key}_${field.name}`;

    switch (field.type) {
      case "toggle":
        return (
          <div className="flex items-center justify-between py-2">
            <Label>{field.label}</Label>
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => updateField(section.key, field.name, String(checked))}
            />
          </div>
        );
      case "select":
        return (
          <div>
            <Label>{field.label}</Label>
            <Select value={value} onValueChange={(v) => updateField(section.key, field.name, v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
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
              <Input
                value={value}
                onChange={e => updateField(section.key, field.name, e.target.value)}
                placeholder="URL or upload..."
                className="flex-1"
              />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={(el) => { fileInputRefs.current[uploadKey] = el; }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageUpload(section.key, field.name, f);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading === uploadKey}
                onClick={() => fileInputRefs.current[uploadKey]?.click()}
              >
                <Upload size={14} className="mr-1" />
                {uploading === uploadKey ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {value && (
              <img src={value} alt="Preview" className="mt-2 h-16 rounded-md border border-border object-contain" />
            )}
          </div>
        );
      case "textarea":
        return (
          <div>
            <Label>{field.label}</Label>
            <Textarea
              value={value}
              onChange={e => updateField(section.key, field.name, e.target.value)}
              placeholder={field.placeholder}
              className="mt-1"
            />
          </div>
        );
      default:
        return (
          <div>
            <Label>{field.label}</Label>
            <Input
              value={value}
              onChange={e => updateField(section.key, field.name, e.target.value)}
              placeholder={field.placeholder}
              className="mt-1"
            />
          </div>
        );
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Site Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Configure your entire website from one place.</p>
      </div>
      {sections.map(section => {
        const Icon = section.icon;
        return (
          <div key={section.key} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon size={20} className="text-primary" />
              <h3 className="font-display font-semibold text-foreground text-lg">{section.label}</h3>
            </div>
            <div className="space-y-4">
              {section.fields.map(field => (
                <div key={field.name}>{renderField(section, field)}</div>
              ))}
            </div>
            <Button
              onClick={() => handleSave(section.key)}
              className="mt-5"
              size="sm"
              disabled={saving === section.key}
            >
              <Save size={14} className="mr-1" />
              {saving === section.key ? "Saving..." : `Save ${section.label}`}
            </Button>
          </div>
        );
      })}
    </div>
  );
};

export default AdminSiteSettings;
