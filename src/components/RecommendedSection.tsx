import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, Clock, User, FolderOpen, Play, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import OptimizedImage from "@/components/OptimizedImage";
import { useHomepageSection } from "@/hooks/useHomepageSection";

interface BlogPost {
  id: string;
  title: string;
  category: string;
  excerpt: string | null;
  read_time: string | null;
  featured_image?: string | null;
  slug?: string | null;
}

interface Material {
  id: string;
  title: string;
  category: string;
  file_size: string | null;
  pages: number | null;
}

interface Video {
  id: string;
  title: string;
  subject: string;
  thumbnail_url: string | null;
  duration: string | null;
}

const RecommendedSection = () => {
  const { lang, t } = useLanguage();
  const { data: sectionCopy } = useHomepageSection("recommended");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const now = new Date().toISOString();
    Promise.all([
      supabase
        .from("blog_posts")
        .select("id, title, category, excerpt, read_time, featured_image, slug")
        .eq("is_published", true)
        .is("trashed_at", null)
        .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
        .or(`expire_at.is.null,expire_at.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("study_materials")
        .select("id, title, category, file_size, pages")
        .eq("is_active", true)
        .is("trashed_at" as any, null)
        .or(`publish_at.is.null,publish_at.lte.${now}`)
        .or(`expire_at.is.null,expire_at.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("educational_videos")
        .select("id, title, subject, thumbnail_url, duration")
        .eq("is_published", true)
        .or(`publish_at.is.null,publish_at.lte.${now}`)
        .or(`expire_at.is.null,expire_at.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(3),
    ]).then(([blogRes, matRes, vidRes]) => {
      setPosts((blogRes.data as BlogPost[]) || []);
      setMaterials((matRes.data as Material[]) || []);
      setVideos((vidRes.data as Video[]) || []);
    });
  }, []);

  const hasContent = posts.length > 0 || materials.length > 0 || videos.length > 0;
  if (!hasContent) return null;
  if (sectionCopy && sectionCopy.is_active === false) return null;

  const isBn = lang === "bn";
  const badge = (isBn ? sectionCopy?.badge_bn : sectionCopy?.badge_en) || (isBn ? "সুপারিশ" : "Recommended");
  const titleRaw = (isBn ? sectionCopy?.title_bn : sectionCopy?.title_en) || (isBn ? "শিক্ষার্থীদের জন্য |সুপারিশ" : "Recommended for |Students");
  const subtitle =
    (isBn ? sectionCopy?.subtitle_bn : sectionCopy?.subtitle_en) ||
    (isBn ? "সর্বশেষ প্রবন্ধ, স্টাডি ম্যাটেরিয়াল ও ভিডিও লেসন" : "Latest articles, study materials, and video lessons");

  const [titlePart1, titleHighlight] = titleRaw.includes("|")
    ? titleRaw.split("|").map((s) => s.trim())
    : [titleRaw, ""];

  return (
    <section className="section-padding" id="recommended">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <span className="badge-soft text-primary border border-primary/20 mb-5">{badge}</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            {titlePart1}{titleHighlight ? " " : ""}{titleHighlight && <span className="gradient-text">{titleHighlight}</span>}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid gap-10 max-w-6xl mx-auto">
          {/* Blog Posts */}
          {posts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-foreground">Latest Articles</h3>
                <Link to={`/${lang}/blog`} className="text-sm text-primary hover:underline">View all →</Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link key={post.id} to={`/${lang}/blog/${post.slug || post.id}`} className="glass-card-hover group flex flex-col overflow-hidden">
                    {post.featured_image && (
                      <OptimizedImage src={post.featured_image} alt={post.title} widths={[400, 800]} className="w-full h-36" />
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{post.category}</span>
                      <h4 className="font-display text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex items-start gap-1.5">
                        {post.title}
                        <ArrowUpRight size={14} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </h4>
                      <p className="text-muted-foreground text-sm line-clamp-2 flex-1">{post.excerpt}</p>
                      {post.read_time && (
                        <span className="inline-flex items-center gap-1 mt-3 text-xs text-muted-foreground"><Clock size={12} /> {post.read_time}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Study Materials */}
          {materials.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-foreground">Study Materials</h3>
                <Link to={`/${lang}/resources`} className="text-sm text-primary hover:underline">View all →</Link>
              </div>
              <div className="grid gap-3 max-w-4xl">
                {materials.map((m) => (
                  <Link key={m.id} to={`/${lang}/resources`} className="glass-card-hover p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <FolderOpen size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-foreground text-sm truncate">{m.title}</h4>
                      <p className="text-xs text-muted-foreground">{m.category}{m.pages ? ` · ${m.pages} pages` : ""}{m.file_size ? ` · ${m.file_size}` : ""}</p>
                    </div>
                    <Download size={14} className="text-primary flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {videos.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-foreground">Video Lessons</h3>
                <Link to={`/${lang}/videos`} className="text-sm text-primary hover:underline">View all →</Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map((v) => (
                  <Link key={v.id} to={`/${lang}/videos`} className="glass-card-hover group flex flex-col overflow-hidden">
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
                      <h4 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">{v.title}</h4>
                      <span className="text-xs text-muted-foreground">{v.subject}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RecommendedSection;
