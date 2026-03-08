import { useState, useEffect, useMemo, useCallback } from "react";
import { Download, FolderOpen, FileText, Eye, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type StudyMaterial = Tables<"study_materials">;

type StudyCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

const tagColors: Record<string, string> = {
  Physics: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Chemistry: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Math: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Biology: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const ResourcesSection = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [categories, setCategories] = useState<StudyCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [matRes, catRes] = await Promise.all([
        supabase.from("study_materials").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("study_categories").select("*").eq("is_active", true).order("sort_order"),
      ]);

      const items = matRes.data || [];
      const cats = (catRes.data || []) as StudyCategory[];

      setMaterials(items);
      setCategories(cats);

      // Set initial active category to first that has materials
      const materialCats = new Set(items.map(m => m.category));
      const firstMatch = cats.find(c => materialCats.has(c.name));
      if (firstMatch) setActiveCategory(firstMatch.name);
      else if (cats.length > 0) setActiveCategory(cats[0].name);

      setLoaded(true);
    };
    fetchData();
  }, []);

  // Only show categories that have materials
  const visibleCategories = useMemo(() => {
    const materialCats = new Set(materials.map(m => m.category));
    return categories.filter(c => materialCats.has(c.name));
  }, [categories, materials]);

  const filtered = activeCategory
    ? materials.filter((m) => m.category === activeCategory)
    : materials;

  if (!loaded) return null;

  return (
    <section id="resources" className="section-padding section-gradient">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            Free Study Materials
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Download <span className="gradient-text">Center</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Access organized notes, question banks, and model tests for SSC &amp; HSC exams
          </p>
        </div>

        {visibleCategories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  cat.name === activeCategory
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "glass-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="max-w-4xl mx-auto grid gap-3">
            {filtered.map((item) => {
              const colorKey = Object.keys(tagColors).find((k) =>
                item.category.toLowerCase().includes(k.toLowerCase())
              );
              const tagColor = colorKey
                ? tagColors[colorKey]
                : "bg-primary/10 text-primary border-primary/20";

              return (
                <div
                  key={item.id}
                  className="glass-card-hover p-5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <FolderOpen size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                        <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tagColor}`}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.pages ? `${item.pages} pages · ` : ""}PDF{item.file_size ? ` · ${item.file_size}` : ""}
                      </p>
                    </div>
                  </div>
                  {item.file_url ? (
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <button
                        onClick={() => { setPreviewUrl(item.file_url); setPreviewTitle(item.title); setPreviewError(false); }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-all"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Preview</span>
                      </button>
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all glow-primary"
                      >
                        <Download size={14} />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Coming soon</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText size={48} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Study materials are being prepared. Check back soon!</p>
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={open => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
            <h3 className="font-medium text-sm text-foreground truncate mr-4">{previewTitle}</h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all"
                >
                  <Download size={12} /> Download
                </a>
              )}
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 overflow-hidden relative" style={{ height: "calc(90vh - 56px)" }}>
            {previewError ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
                <AlertTriangle size={48} className="text-muted-foreground/40" />
                <p className="text-muted-foreground">Unable to preview this PDF in the browser.</p>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all"
                  >
                    <Download size={14} /> Download instead
                  </a>
                )}
              </div>
            ) : (
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-0"
                title={`Preview: ${previewTitle}`}
                onError={() => setPreviewError(true)}
                onLoad={(e) => {
                  // Some browsers block PDF rendering in iframes silently
                  // We can't reliably detect this, so we keep the iframe
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ResourcesSection;
