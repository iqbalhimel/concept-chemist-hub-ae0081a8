import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, Clock, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BlogPost {
  id: string;
  title: string;
  category: string;
  excerpt: string | null;
  read_time: string | null;
  featured_image?: string | null;
  created_at: string;
  slug?: string | null;
}

interface Props {
  matchCategory: string;
  title?: string;
}

const RelatedBlogPosts = ({ matchCategory, title = "Related Blog Posts" }: Props) => {
  const { lang, t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (!matchCategory) return;
    const now = new Date().toISOString();
    supabase
      .from("blog_posts")
      .select("id, title, category, excerpt, read_time, featured_image, created_at, slug")
      .eq("is_published", true)
      .is("trashed_at", null)
      .eq("category", matchCategory)
      .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
      .or(`expire_at.is.null,expire_at.gte.${now}`)
      .order("sort_order", { ascending: true })
      .limit(3)
      .then(({ data }) => setPosts((data as BlogPost[]) || []));
  }, [matchCategory]);

  if (posts.length === 0) return null;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="font-display text-2xl font-bold text-foreground mb-6">
          {title.split(" ").slice(0, -1).join(" ")} <span className="text-primary">{title.split(" ").pop()}</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/${lang}/blog/${post.slug || post.id}`}
              className="glass-card-hover group flex flex-col overflow-hidden"
            >
              {post.featured_image && (
                <div className="w-full h-36 overflow-hidden">
                  <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{post.category}</span>
                <h3 className="font-display text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex items-start gap-1.5">
                  {post.title}
                  <ArrowUpRight size={14} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </h3>
                <p className="text-muted-foreground text-sm line-clamp-2 flex-1">{post.excerpt}</p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><User size={12} /> {t.blog.by}</span>
                  {post.read_time && <span className="inline-flex items-center gap-1"><Clock size={12} /> {post.read_time}</span>}
                  <span className="ml-auto">{formatDate(post.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedBlogPosts;
