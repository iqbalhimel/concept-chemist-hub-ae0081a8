import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Download, FolderOpen, Play, Clock, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RelatedMaterial {
  id: string;
  title: string;
  category: string;
  file_url: string | null;
  file_size: string | null;
  pages: number | null;
}

interface RelatedVideo {
  id: string;
  title: string;
  subject: string;
  thumbnail_url: string | null;
  duration: string | null;
}

interface Props {
  postCategory: string;
  postTags?: string[]; // tag names
}

const RelatedCrossContent = ({ postCategory, postTags = [] }: Props) => {
  const { lang } = useLanguage();
  const [materials, setMaterials] = useState<RelatedMaterial[]>([]);
  const [videos, setVideos] = useState<RelatedVideo[]>([]);

  useEffect(() => {
    const fetchRelated = async () => {
      const now = new Date().toISOString();

      // Match materials by category (study_materials.category matches blog category or tag names)
      const matchTerms = [postCategory, ...postTags].filter(Boolean);
      const { data: mats } = await supabase
        .from("study_materials")
        .select("id, title, category, file_url, file_size, pages")
        .eq("is_active", true)
        .is("trashed_at" as any, null)
        .or(`publish_at.is.null,publish_at.lte.${now}`)
        .or(`expire_at.is.null,expire_at.gte.${now}`)
        .in("category", matchTerms)
        .limit(3);
      setMaterials(mats || []);

      // Match videos by subject containing category or tag names
      const { data: vids } = await supabase
        .from("educational_videos")
        .select("id, title, subject, thumbnail_url, duration")
        .eq("is_published", true)
        .or(`publish_at.is.null,publish_at.lte.${now}`)
        .or(`expire_at.is.null,expire_at.gte.${now}`)
        .in("subject", matchTerms)
        .limit(3);
      setVideos(vids || []);
    };
    fetchRelated();
  }, [postCategory, postTags.join(",")]);

  if (materials.length === 0 && videos.length === 0) return null;

  return (
    <>
      {materials.length > 0 && (
        <section className="pb-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Related <span className="text-primary">Study Materials</span>
            </h2>
            <div className="grid gap-3">
              {materials.map((m) => (
                <div key={m.id} className="glass-card-hover p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <FolderOpen size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">{m.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {m.category}{m.pages ? ` · ${m.pages} pages` : ""}{m.file_size ? ` · ${m.file_size}` : ""}
                      </p>
                    </div>
                  </div>
                  {m.file_url && (
                    <Link
                      to={`/${lang}/resources`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all flex-shrink-0"
                    >
                      <Download size={12} /> View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="pb-12">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Related <span className="text-primary">Videos</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v) => (
                <Link
                  key={v.id}
                  to={`/${lang}/videos`}
                  className="glass-card-hover group flex flex-col overflow-hidden"
                >
                  <div className="relative aspect-video bg-muted">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center"><Play size={32} className="text-muted-foreground/30" /></div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-background/20 group-hover:bg-background/40 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
                        <Play size={18} className="text-primary-foreground ml-0.5" />
                      </div>
                    </div>
                    {v.duration && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-background/80 text-xs font-medium text-foreground backdrop-blur-sm flex items-center gap-1">
                        <Clock size={10} /> {v.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">{v.title}</h3>
                    <span className="text-xs text-muted-foreground mt-1">{v.subject}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
};

export default RelatedCrossContent;
