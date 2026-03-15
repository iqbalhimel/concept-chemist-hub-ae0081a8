import { useState, useEffect, useMemo } from "react";
import { Download, FolderOpen, FileText, Eye, X, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PdfViewer from "@/components/PdfViewer";
import { useLanguage } from "@/contexts/LanguageContext";
import { setSeo } from "@/lib/seo";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type StudyMaterial = Tables<"study_materials">;
type StudyCategory = { id: string; name: string; slug: string; sort_order: number; is_active: boolean; };

const tagColors: Record<string, string> = {
  Physics: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Chemistry: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Math: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Biology: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const PAGE_SIZE = 10;

const ResourcesPage = () => {
  const { t, lang } = useLanguage();
  const { get } = useSiteSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [categories, setCategories] = useState<StudyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");

  const activeCategorySlug = searchParams.get("category") || null;

  useEffect(() => {
    const autoCanonical = "https://iqbalsir.bd/resources";
    const defaultOgImage = get("seo", "og_image", "");
    const cleanup = setSeo({
      title: "Study Materials – Iqbal Sir",
      description: "Download study materials, notes, and resources from Iqbal Sir.",
      url: autoCanonical,
      canonicalUrl: autoCanonical,
      image: defaultOgImage || undefined,
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date().toISOString();
      const [matRes, catRes] = await Promise.all([
        supabase.from("study_materials").select("*").eq("is_active", true).is("trashed_at" as any, null)
          .or(`publish_at.is.null,publish_at.lte.${now}`)
          .or(`expire_at.is.null,expire_at.gte.${now}`)
          .order("created_at", { ascending: false }),
        supabase.from("study_categories").select("*").eq("is_active", true).order("sort_order"),
      ]);
      setMaterials(matRes.data || []);
      setCategories((catRes.data || []) as StudyCategory[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const visibleCategories = useMemo(() => {
    const materialCats = new Set(materials.map(m => m.category));
    return categories.filter(c => materialCats.has(c.name));
  }, [categories, materials]);

  const activeCategory = useMemo(() => {
    if (!activeCategorySlug) return null;
    return visibleCategories.find(c => c.slug === activeCategorySlug) || null;
  }, [activeCategorySlug, visibleCategories]);

  const filtered = activeCategory
    ? materials.filter(m => m.category === activeCategory.name)
    : materials;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCategoryChange = (slug: string | null) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  const getTagColor = (category: string) => {
    const colorKey = Object.keys(tagColors).find(k => category.toLowerCase().includes(k.toLowerCase()));
    return colorKey ? tagColors[colorKey] : "bg-primary/10 text-primary border-primary/20";
  };

  return (
    <>
      <main id="main-content" className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to={`/${lang}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft size={16} />
            {t.not_found.back}
          </Link>

          <div className="text-center mb-12">
            <span className="badge-soft text-primary border border-primary/20 mb-5">
              {t.resources.badge}
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
              {t.resources.title_1} <span className="gradient-text">{t.resources.title_highlight}</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.resources.subtitle}</p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-12">Loading...</div>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
                <button
                  onClick={() => handleCategoryChange(null)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    !activeCategorySlug
                      ? "bg-primary text-primary-foreground glow-primary"
                      : "glass-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                  }`}
                >
                  {t.resources.all_categories}
                </button>
                {visibleCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      cat.slug === activeCategorySlug
                        ? "bg-primary text-primary-foreground glow-primary"
                        : "glass-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-muted-foreground mb-6">
                {t.resources.showing} {paginated.length} {t.resources.of} {filtered.length} {t.resources.materials}
              </p>

              {paginated.length > 0 ? (
                <div className="max-w-4xl mx-auto grid gap-3">
                  {paginated.map((item) => {
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
              ) : (
                <div className="text-center py-8">
                  <FileText size={48} className="text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">{t.resources.empty}</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        page === i + 1
                          ? "bg-primary text-primary-foreground"
                          : "glass-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Dialog open={!!previewUrl} onOpenChange={open => { if (!open) setPreviewUrl(null); }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden [&>button:last-child]:hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background flex-shrink-0">
            <h3 className="font-medium text-sm text-foreground truncate flex-1 min-w-0">{previewTitle}</h3>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all flex-shrink-0">
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
    </>
  );
};

export default ResourcesPage;
