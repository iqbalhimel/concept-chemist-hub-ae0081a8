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

const HOMEPAGE_LIMIT = 5;

const ResourcesSection = () => {
  const { t, lang } = useLanguage();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<StudyCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [matRes, catRes, countRes] = await Promise.all([
        supabase.from("study_materials").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(HOMEPAGE_LIMIT),
        supabase.from("study_categories").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("study_materials").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);

      const items = matRes.data || [];
      const cats = (catRes.data || []) as StudyCategory[];

      setMaterials(items);
      setCategories(cats);
      setTotalCount(countRes.count || 0);

      const materialCats = new Set(items.map(m => m.category));
      const firstMatch = cats.find(c => materialCats.has(c.name));
      if (firstMatch) setActiveCategory(firstMatch.name);
      else if (cats.length > 0) setActiveCategory(cats[0].name);

      setLoaded(true);
    };
    fetchData();
  }, []);

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
            {t.resources.badge}
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            {t.resources.title_1} <span className="gradient-text">{t.resources.title_highlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t.resources.subtitle}
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
        ) : (
          <div className="text-center py-8">
            <FileText size={48} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t.resources.empty}</p>
          </div>
        )}

        {totalCount > HOMEPAGE_LIMIT && (
          <div className="text-center mt-10">
            <Link
              to={`/${lang}/resources`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all glow-primary"
            >
              {t.resources.see_all}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
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
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 flex-shrink-0"
              onClick={() => setPreviewUrl(null)}
            >
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
