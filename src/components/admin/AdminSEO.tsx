import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Upload, Search } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";
import { invalidateSiteSettings } from "@/hooks/useSiteSettings";

const SECTION_KEY = "seo";

const AdminSEO = () => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SECTION_KEY)
        .maybeSingle();
      if (data?.value) setFields(data.value as Record<string, string>);
      setLoading(false);
    })();
  }, []);

  const update = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: SECTION_KEY, value: fields }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      invalidateSiteSettings();
      toast.success("SEO settings saved!");
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      let fileToUpload: File | Blob = file;
      if (file.type.startsWith("image/") && file.size > 200 * 1024) {
        const { blob } = await compressImage(file, 1200, 1200, 0.8);
        fileToUpload = blob;
      }
      const ext = file.name.split(".").pop();
      const path = `settings/seo-og_image-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, fileToUpload);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      update("og_image", urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">SEO Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage meta tags, Open Graph data, and search engine settings.
        </p>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-primary" />
          <h3 className="font-display font-semibold text-foreground text-lg">Search Engine Optimization</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Meta Title</Label>
            <Input value={fields.meta_title || ""} onChange={(e) => update("meta_title", e.target.value)} placeholder="Iqbal Sir – Science Teacher" className="mt-1" />
          </div>
          <div>
            <Label>Meta Description</Label>
            <Textarea value={fields.meta_description || ""} onChange={(e) => update("meta_description", e.target.value)} placeholder="Best science teacher in Kishoreganj..." className="mt-1" />
          </div>
          <div>
            <Label>Meta Keywords</Label>
            <Input value={fields.meta_keywords || ""} onChange={(e) => update("meta_keywords", e.target.value)} placeholder="science, teacher, kishoreganj" className="mt-1" />
          </div>
          <div>
            <Label>Open Graph Title</Label>
            <Input value={fields.og_title || ""} onChange={(e) => update("og_title", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Open Graph Description</Label>
            <Textarea value={fields.og_description || ""} onChange={(e) => update("og_description", e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Open Graph Image</Label>
            <div className="flex items-center gap-3 mt-1">
              <Input value={fields.og_image || ""} onChange={(e) => update("og_image", e.target.value)} placeholder="URL or upload..." className="flex-1" />
              <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload size={14} className="mr-1" />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            {fields.og_image && (
              <img src={fields.og_image} alt="OG Preview" className="mt-2 h-16 rounded-md border border-border object-contain" />
            )}
          </div>
          <div>
            <Label>Google Analytics ID</Label>
            <Input value={fields.ga_id || ""} onChange={(e) => update("ga_id", e.target.value)} placeholder="G-XXXXXXXXXX" className="mt-1" />
          </div>
          <div>
            <Label>Google Search Console Verification Code</Label>
            <Input value={fields.gsc_code || ""} onChange={(e) => update("gsc_code", e.target.value)} className="mt-1" />
          </div>
        </div>

        <Button onClick={handleSave} className="mt-5" size="sm" disabled={saving}>
          <Save size={14} className="mr-1" />
          {saving ? "Saving..." : "Save SEO Settings"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSEO;
