import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Upload, Search, Globe, FileText, Code } from "lucide-react";
import { compressImage } from "@/lib/imageCompression";
import { invalidateSiteSettings } from "@/hooks/useSiteSettings";

const SECTION_KEY = "seo";
const ROBOTS_KEY = "robots_txt";

/* ── Live Preview Components ──────────────────────── */

const GooglePreview = ({ title, description, url }: { title: string; description: string; url: string }) => (
  <div className="rounded-lg border border-border bg-card p-4 space-y-1">
    <p className="text-xs text-muted-foreground font-mono truncate">{url || "https://iqbalsir.bd"}</p>
    <p className="text-primary text-base font-medium truncate leading-snug">{title || "Page Title"}</p>
    <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{description || "Page description will appear here..."}</p>
  </div>
);

const FacebookPreview = ({ title, description, image, url }: { title: string; description: string; image: string; url: string }) => (
  <div className="rounded-lg border border-border bg-card overflow-hidden max-w-md">
    {image && <img src={image} alt="OG" className="w-full h-40 object-cover" />}
    <div className="p-3 space-y-1 bg-muted/30">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{url ? new URL(url).hostname : "iqbalsir.bd"}</p>
      <p className="text-foreground font-semibold text-sm truncate">{title || "Open Graph Title"}</p>
      <p className="text-muted-foreground text-xs line-clamp-2">{description || "Open Graph description..."}</p>
    </div>
  </div>
);

const TwitterPreview = ({ title, description, image }: { title: string; description: string; image: string }) => (
  <div className="rounded-xl border border-border bg-card overflow-hidden max-w-md">
    {image && <img src={image} alt="Twitter" className="w-full h-40 object-cover" />}
    <div className="p-3 space-y-0.5">
      <p className="text-foreground font-semibold text-sm truncate">{title || "Twitter Card Title"}</p>
      <p className="text-muted-foreground text-xs line-clamp-2">{description || "Twitter card description..."}</p>
    </div>
  </div>
);

/* ── Main Component ───────────────────────────────── */

const AdminSEO = () => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [robotsTxt, setRobotsTxt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const twitterFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      const [seoRes, robotsRes] = await Promise.all([
        supabase.from("site_settings").select("value").eq("key", SECTION_KEY).maybeSingle(),
        supabase.from("site_settings").select("value").eq("key", ROBOTS_KEY).maybeSingle(),
      ]);
      if (seoRes.data?.value) setFields(seoRes.data.value as Record<string, string>);
      if (robotsRes.data?.value) {
        const val = robotsRes.data.value as Record<string, string>;
        setRobotsTxt(val.content || "");
      }
      setLoading(false);
    })();
  }, []);

  const update = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (section: string) => {
    setSaving(section);
    if (section === "robots") {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: ROBOTS_KEY, value: { content: robotsTxt } }, { onConflict: "key" });
      setSaving(null);
      if (error) { toast.error("Failed: " + error.message); return; }
      invalidateSiteSettings();
      toast.success("robots.txt saved!");
      return;
    }
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: SECTION_KEY, value: fields }, { onConflict: "key" });
    setSaving(null);
    if (error) { toast.error("Failed: " + error.message); return; }
    invalidateSiteSettings();
    toast.success("SEO settings saved!");
  };

  const handleImageUpload = async (field: string, file: File, ref: React.RefObject<HTMLInputElement | null>) => {
    setUploading(true);
    try {
      let fileToUpload: File | Blob = file;
      if (file.type.startsWith("image/") && file.size > 200 * 1024) {
        const { blob } = await compressImage(file, 1200, 1200, 0.8);
        fileToUpload = blob;
      }
      const ext = file.name.split(".").pop();
      const path = `settings/seo-${field}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, fileToUpload);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      update(field, urlData.publicUrl);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  const ogTitle = fields.og_title || fields.meta_title || "";
  const ogDesc = fields.og_description || fields.meta_description || "";
  const ogImage = fields.og_image || "";
  const twitterTitle = fields.twitter_title || ogTitle;
  const twitterDesc = fields.twitter_description || ogDesc;
  const twitterImage = fields.twitter_image || ogImage;
  const canonicalUrl = fields.canonical_url || "https://iqbalsir.bd";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">SEO Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Advanced SEO controls — meta tags, social cards, schema, sitemap, and robots.txt.
        </p>
      </div>

      {/* ── Meta Tags ──────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search size={20} className="text-primary" />
          <h3 className="font-display font-semibold text-foreground text-lg">Meta Tags & Indexing</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Meta Title <span className="text-muted-foreground text-xs ml-1">({(fields.meta_title || "").length}/60)</span></Label>
            <Input value={fields.meta_title || ""} onChange={(e) => update("meta_title", e.target.value)} placeholder="Iqbal Sir – Science Teacher" className="mt-1" />
          </div>
          <div>
            <Label>Meta Description <span className="text-muted-foreground text-xs ml-1">({(fields.meta_description || "").length}/160)</span></Label>
            <Textarea value={fields.meta_description || ""} onChange={(e) => update("meta_description", e.target.value)} placeholder="Best science teacher in Kishoreganj..." className="mt-1" rows={3} />
          </div>
          <div>
            <Label>Meta Keywords</Label>
            <Input value={fields.meta_keywords || ""} onChange={(e) => update("meta_keywords", e.target.value)} placeholder="science, teacher, kishoreganj" className="mt-1" />
          </div>
          <div>
            <Label>Canonical URL</Label>
            <Input value={fields.canonical_url || ""} onChange={(e) => update("canonical_url", e.target.value)} placeholder="https://iqbalsir.bd" className="mt-1" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Robots — Index</Label>
              <Select value={fields.robots_index || "index"} onValueChange={(v) => update("robots_index", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="index">index</SelectItem>
                  <SelectItem value="noindex">noindex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Robots — Follow</Label>
              <Select value={fields.robots_follow || "follow"} onValueChange={(v) => update("robots_follow", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow">follow</SelectItem>
                  <SelectItem value="nofollow">nofollow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Google Analytics ID</Label>
              <Input value={fields.ga_id || ""} onChange={(e) => update("ga_id", e.target.value)} placeholder="G-XXXXXXXXXX" className="mt-1" />
            </div>
            <div>
              <Label>Google Search Console Code</Label>
              <Input value={fields.gsc_code || ""} onChange={(e) => update("gsc_code", e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Bing Verification Code</Label>
            <Input value={fields.bing_code || ""} onChange={(e) => update("bing_code", e.target.value)} placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" className="mt-1" />
          </div>
        </div>
      </div>

      {/* ── Open Graph ─────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={20} className="text-primary" />
          <h3 className="font-display font-semibold text-foreground text-lg">Open Graph (Facebook)</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label>OG Title</Label>
            <Input value={fields.og_title || ""} onChange={(e) => update("og_title", e.target.value)} placeholder="Falls back to Meta Title" className="mt-1" />
          </div>
          <div>
            <Label>OG Description</Label>
            <Textarea value={fields.og_description || ""} onChange={(e) => update("og_description", e.target.value)} placeholder="Falls back to Meta Description" className="mt-1" rows={2} />
          </div>
          <div>
            <Label>OG Image (Default Fallback)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Input value={fields.og_image || ""} onChange={(e) => update("og_image", e.target.value)} placeholder="URL or upload..." className="flex-1" />
              <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload("og_image", f, fileRef); }} />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload size={14} className="mr-1" /> {uploading ? "..." : "Upload"}
              </Button>
            </div>
            {fields.og_image && <img src={fields.og_image} alt="OG" className="mt-2 h-16 rounded-md border border-border object-contain" />}
          </div>
        </div>
      </div>

      {/* ── Twitter Card ───────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" className="text-primary"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          <h3 className="font-display font-semibold text-foreground text-lg">Twitter Card</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Card Type</Label>
            <Select value={fields.twitter_card || "summary_large_image"} onValueChange={(v) => update("twitter_card", v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="summary">Summary</SelectItem>
                <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Twitter Title</Label>
            <Input value={fields.twitter_title || ""} onChange={(e) => update("twitter_title", e.target.value)} placeholder="Falls back to OG Title" className="mt-1" />
          </div>
          <div>
            <Label>Twitter Description</Label>
            <Textarea value={fields.twitter_description || ""} onChange={(e) => update("twitter_description", e.target.value)} placeholder="Falls back to OG Description" className="mt-1" rows={2} />
          </div>
          <div>
            <Label>Twitter Image</Label>
            <div className="flex items-center gap-3 mt-1">
              <Input value={fields.twitter_image || ""} onChange={(e) => update("twitter_image", e.target.value)} placeholder="Falls back to OG Image" className="flex-1" />
              <input type="file" accept="image/*" className="hidden" ref={twitterFileRef} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload("twitter_image", f, twitterFileRef); }} />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => twitterFileRef.current?.click()}>
                <Upload size={14} className="mr-1" /> {uploading ? "..." : "Upload"}
              </Button>
            </div>
            {fields.twitter_image && <img src={fields.twitter_image} alt="Twitter" className="mt-2 h-16 rounded-md border border-border object-contain" />}
          </div>
        </div>
      </div>

      {/* Save SEO */}
      <Button onClick={() => handleSave("seo")} size="sm" disabled={saving === "seo"}>
        <Save size={14} className="mr-1" /> {saving === "seo" ? "Saving..." : "Save SEO Settings"}
      </Button>

      {/* ── Live Previews ──────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={20} className="text-primary" />
          <h3 className="font-display font-semibold text-foreground text-lg">Live Previews</h3>
        </div>
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Google Search Result</p>
            <GooglePreview title={fields.meta_title || ""} description={fields.meta_description || ""} url={canonicalUrl} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Facebook / Open Graph</p>
            <FacebookPreview title={ogTitle} description={ogDesc} image={ogImage} url={canonicalUrl} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Twitter Card</p>
            <TwitterPreview title={twitterTitle} description={twitterDesc} image={twitterImage} />
          </div>
        </div>
      </div>

      {/* ── Robots.txt Manager ─────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={20} className="text-primary" />
          <h3 className="font-display font-semibold text-foreground text-lg">robots.txt Manager</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Edit your robots.txt content below. Changes will be served dynamically at <code className="bg-muted px-1 rounded">/robots.txt</code>.
        </p>
        <Textarea
          value={robotsTxt}
          onChange={(e) => setRobotsTxt(e.target.value)}
          className="font-mono text-sm min-h-[200px]"
          placeholder={`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: https://iqbalsir.bd/sitemap.xml`}
        />
        <Button onClick={() => handleSave("robots")} className="mt-3" size="sm" disabled={saving === "robots"}>
          <Save size={14} className="mr-1" /> {saving === "robots" ? "Saving..." : "Save robots.txt"}
        </Button>
      </div>

      {/* ── Schema / JSON-LD Info ──────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Code size={20} className="text-primary" />
          <h3 className="font-display font-semibold text-foreground text-lg">JSON-LD Schema Markup</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Structured data is <span className="text-primary font-medium">automatically generated</span> and injected on relevant pages:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
          <li><span className="text-foreground font-medium">Person</span> — Homepage (teacher profile)</li>
          <li><span className="text-foreground font-medium">EducationalOrganization</span> — Homepage (coaching info)</li>
          <li><span className="text-foreground font-medium">Article</span> — Each blog post page</li>
          <li><span className="text-foreground font-medium">FAQPage</span> — Homepage FAQ section</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminSEO;
