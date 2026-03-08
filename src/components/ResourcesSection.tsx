import { useState, useEffect, useMemo } from "react";
import { Download, FolderOpen, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type StudyMaterial = Tables<"study_materials">;

const tagColors: Record<string, string> = {
  Physics: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Chemistry: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Math: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Biology: "bg-rose-500/15 text-rose-400 border-rose-500/20",
};

const ResourcesSection = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaterials = async () => {
      const { data } = await supabase
        .from("study_materials")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      const items = data || [];
      setMaterials(items);
      if (items.length > 0) {
        const cats = [...new Set(items.map((m) => m.category))];
        setActiveCategory(cats[0]);
      }
      setLoaded(true);
    };
    fetchMaterials();
  }, []);

  const categories = useMemo(
    () => [...new Set(materials.map((m) => m.category))],
    [materials]
  );

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

        {categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  cat === activeCategory
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "glass-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length > 0 ? (
          <div className="max-w-4xl mx-auto grid gap-3">
            {filtered.map((item, i) => {
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
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all glow-primary"
                    >
                      <Download size={14} />
                      <span className="hidden sm:inline">Download</span>
                    </a>
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
    </section>
  );
};

export default ResourcesSection;
