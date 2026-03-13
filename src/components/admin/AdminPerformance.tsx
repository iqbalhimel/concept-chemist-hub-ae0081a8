import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invalidateSiteSettings, useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Zap, Image, Eye, Type, Trash2, Gauge, Save, Loader2,
} from "lucide-react";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";

const AdminPerformance = () => {
  const csrfGuard = useCsrfGuard();
  const { get, loaded } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Image optimization
  const [imgCompress, setImgCompress] = useState(true);
  const [imgWebp, setImgWebp] = useState(true);
  const [imgMaxWidth, setImgMaxWidth] = useState("1920");
  const [imgMaxHeight, setImgMaxHeight] = useState("1920");
  const [imgQuality, setImgQuality] = useState("82");

  // Lazy loading
  const [lazyLoading, setLazyLoading] = useState(true);

  // Font preloading
  const [fontPreload, setFontPreload] = useState(true);

  // Animation performance mode
  const [reduceAnimations, setReduceAnimations] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    setImgCompress(get("performance", "img_compress", "true") === "true");
    setImgWebp(get("performance", "img_webp", "true") === "true");
    setImgMaxWidth(get("performance", "img_max_width", "1920"));
    setImgMaxHeight(get("performance", "img_max_height", "1920"));
    setImgQuality(get("performance", "img_quality", "82"));
    setLazyLoading(get("performance", "lazy_loading", "true") === "true");
    setFontPreload(get("performance", "font_preload", "true") === "true");
    setReduceAnimations(get("performance", "reduce_animations", "false") === "true");
  }, [loaded]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const value = {
        img_compress: String(imgCompress),
        img_webp: String(imgWebp),
        img_max_width: imgMaxWidth,
        img_max_height: imgMaxHeight,
        img_quality: imgQuality,
        lazy_loading: String(lazyLoading),
        font_preload: String(fontPreload),
        reduce_animations: String(reduceAnimations),
      };
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", "performance")
        .maybeSingle();

      if (existing) {
        await supabase.from("site_settings").update({ value }).eq("key", "performance");
      } else {
        await supabase.from("site_settings").insert({ key: "performance", value });
      }
      invalidateSiteSettings();
      toast.success("Performance settings saved");
    } catch {
      toast.error("Failed to save performance settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      // Clear service worker caches
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      // Unregister and re-register service worker to force fresh cache
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
        // Re-register after a short delay
        setTimeout(() => {
          navigator.serviceWorker.register("/sw.js");
        }, 1000);
      }
      toast.success("Cache cleared! Static assets, pages, and SEO files will be regenerated on next visit.");
    } catch {
      toast.error("Failed to clear cache");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Performance Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Optimize website speed and resource loading</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
          Save Settings
        </Button>
      </div>

      {/* Image Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image size={20} className="text-primary" />
            Image Optimization
          </CardTitle>
          <CardDescription>
            Automatically compress and convert uploaded images for faster loading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Compress Images on Upload</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Reduce file size while maintaining visual quality</p>
            </div>
            <Switch checked={imgCompress} onCheckedChange={setImgCompress} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Generate WebP Versions</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Serve modern WebP format when browser supports it</p>
            </div>
            <Switch checked={imgWebp} onCheckedChange={setImgWebp} />
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Max Width (px)</Label>
              <Input
                type="number"
                value={imgMaxWidth}
                onChange={(e) => setImgMaxWidth(e.target.value)}
                min={320}
                max={4096}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Max Height (px)</Label>
              <Input
                type="number"
                value={imgMaxHeight}
                onChange={(e) => setImgMaxHeight(e.target.value)}
                min={320}
                max={4096}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Quality (%)</Label>
              <Input
                type="number"
                value={imgQuality}
                onChange={(e) => setImgQuality(e.target.value)}
                min={10}
                max={100}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lazy Loading */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye size={20} className="text-primary" />
            Lazy Loading
          </CardTitle>
          <CardDescription>
            Defer loading of off-screen images and media until they are needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Lazy Loading</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Images, galleries, and embedded media load only when scrolled into view
              </p>
            </div>
            <Switch checked={lazyLoading} onCheckedChange={setLazyLoading} />
          </div>
        </CardContent>
      </Card>

      {/* Font Preloading */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Type size={20} className="text-primary" />
            Font Optimization
          </CardTitle>
          <CardDescription>
            Preload primary fonts to eliminate render-blocking and flash of unstyled text
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Preload Primary Fonts</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adds preload link tags for display and body fonts in the page head
              </p>
            </div>
            <Switch checked={fontPreload} onCheckedChange={setFontPreload} />
          </div>
        </CardContent>
      </Card>

      {/* Animation Performance Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge size={20} className="text-primary" />
            Animation Performance Mode
          </CardTitle>
          <CardDescription>
            Reduce heavy animations and scroll effects on low-performance devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Reduce Animations</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Disables parallax, particle effects, and complex transitions on mobile and low-end devices
              </p>
            </div>
            <Switch checked={reduceAnimations} onCheckedChange={setReduceAnimations} />
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trash2 size={20} className="text-primary" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Clear cached pages, assets, and regenerate SEO files (sitemap, robots.txt)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Clear All Caches</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Purges service worker cache, static assets, and forces SEO file regeneration
              </p>
            </div>
            <Button variant="destructive" onClick={handleClearCache} disabled={clearing}>
              {clearing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPerformance;
