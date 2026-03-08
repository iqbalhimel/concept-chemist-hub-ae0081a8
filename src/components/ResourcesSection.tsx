import { useState, useEffect, useMemo } from "react";
import { Download, FolderOpen, FileText, Eye, X, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PdfViewer from "@/components/PdfViewer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

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

const ITEMS_PER_CATEGORY = 3;

const ResourcesSection = () => {
  const { t, lang } = useLanguage();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [categories, setCategories] = useState<StudyCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [matRes, catRes] = await Promise.all([
        supabase.from("study_materials").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("study_categories").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setMaterials(matRes.data || []);
      setCategories((catRes.data || []) as StudyCategory[]);
      setLoaded(true);
    };
    fetchData();
  }, []);

  // Group materials by category, only categories that have materials
  const groupedByCategory = useMemo(() => {
    const materialsByCat = new Map<string, StudyMaterial[]>();
    for (const m of materials) {
      const list = materialsByCat.get(m.category) || [];
      list.push(m);
      materialsByCat.set(m.category, list);
    }
    return categories
      .filter(c => materialsByCat.has(c.name))
      .map(c => ({
        category: c,
        items: materialsByCat.get(c.name)!,
      }));
  }, [categories, materials]);

  if (!loaded || groupedByCategory.length === 0) return loaded ? null : null;

  const getTagColor = (category: string) => {
    const colorKey = Object.keys(tagColors).find(k => category.toLowerCase().includes(k.toLowerCase()));
    return colorKey ? tagColors[colorKey] : "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <section id="resources" className="section-padding section-gradient">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            {t.resources.badge}
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            {t.resources.title_1} <span className="gradient-text">{t.resources.title_highlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t.resources.subtitle}
          </p>
        </div>

        <div className="space-y-12">
          {groupedByCategory.map(({ category, items }) => {
            const visible = items.slice(0, ITEMS_PER_CATEGORY);
            const hasMore = items.length > ITEMS_PER_CATEGORY;

            return (
              <div key={category.id}>
                <h3 className="font-display text-xl md:text-2xl font-bold mb-5 text-foreground">
                  {category.name}
                </h3>
                <div className="max-w-4xl mx-auto grid gap-3">
                  {visible.map((item) => {
                    const tagColor = getTagColor(item.category);
                    return (
                      <div key={item.id} className="glass-card-hover p-5 flex items-center justify-between gap-4">
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
                              {item.pages ? `${item.pages} ${t.resources.pages} · ` : ""}PDF{item.file_size ? ` · ${item.file_size}` : ""}
                            </p>
                          </div>
                        </div>
                        {item.file_url ? (
                          <div className="flex-shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => { setPreviewUrl(item.file_url); setPreviewTitle(item.title); }}
                              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-all"
                            >
                              <Eye size={14} />
                              <span className="hidden sm:inline">{t.resources.preview}</span>
                            </button>
                            <a
                              href={item.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all glow-primary"
                            >
                              <Download size={14} />
                              <span className="hidden sm:inline">{t.resources.download}</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t.resources.coming_soon}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {hasMore && (
                  <div className="text-center mt-4">
                    <Link
                      to={`/${lang}/resources?category=${encodeURIComponent(category.slug)}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all glow-primary"
                    >
                      {t.resources.see_all_category}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* PDF Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={open => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden [&>button:last-child]:hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background flex-shrink-0">
            <h3 className="font-medium text-sm text-foreground truncate flex-1 min-w-0">{previewTitle}</h3>
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all flex-shrink-0"
              >
                <Download size={12} /> <span className="hidden sm:inline">{t.resources.download}</span>
              </a>
            )}
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => setPreviewUrl(null)}>
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden" style={{ height: "calc(90vh - 56px)" }}>
            {previewUrl && <PdfViewer url={previewUrl} title={previewTitle} />}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ResourcesSection;
