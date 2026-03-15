import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, Clock, User, ChevronLeft, ChevronRight, MessageSquare, ArrowLeft } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import { setSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
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

const POSTS_PER_PAGE = 9;

const BlogTagPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLanguage();
  const [tagName, setTagName] = useState<string>("");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!tagName) return;
    const cleanup = setSeo({
      title: `"${tagName}" Tag – Blog | Iqbal Sir`,
      description: `Browse all blog posts tagged with "${tagName}" by Iqbal Sir.`,
      url: `https://iqbalsir.bd/blog/tag/${slug}`,
      canonicalUrl: `https://iqbalsir.bd/blog/tag/${slug}`,
      type: "website",
    });
    return cleanup;
  }, [tagName, slug]);

  useEffect(() => { window.scrollTo(0, 0); }, [page]);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!slug) return;
      setLoading(true);

      // Resolve tag by slug
      const { data: tag } = await supabase.from("tags").select("id, name").eq("slug", slug).maybeSingle();
      if (!tag) { setLoading(false); setTagName(slug); return; }
      setTagName(tag.name);

      // Get post IDs for this tag
      const { data: postTags } = await supabase.from("post_tags").select("post_id").eq("tag_id", tag.id);
      const postIds = (postTags || []).map((pt: any) => pt.post_id);
      if (postIds.length === 0) { setPosts([]); setTotal(0); setLoading(false); return; }

      const now = new Date().toISOString();
      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      const { data, count } = await supabase
        .from("blog_posts")
        .select("*", { count: "exact" })
        .eq("is_published", true)
        .is("trashed_at", null)
        .in("id", postIds)
        .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
        .or(`expire_at.is.null,expire_at.gte.${now}`)
        .order("sort_order", { ascending: true })
        .range(from, to);

      setPosts((data as BlogPost[]) || []);
      setTotal(count || 0);

      if (data && data.length > 0) {
        const ids = data.map((d: any) => d.id);
        const { data: cData } = await supabase.from("blog_post_comments").select("post_id").in("post_id", ids);
        if (cData) {
          const counts: Record<string, number> = {};
          cData.forEach((c: any) => { counts[c.post_id] = (counts[c.post_id] || 0) + 1; });
          setCommentCounts(counts);
        }
      }
      setLoading(false);
    };
    fetchPosts();
  }, [page, slug]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <main id="main-content" className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <Link to={`/${lang}/blog`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Blog
        </Link>

        <div className="text-center mb-12">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
            Tag: <span className="gradient-text">{tagName || slug}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            All posts tagged with "{tagName || slug}"
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-20">
            <p className="text-lg mb-4">No posts found with this tag.</p>
            <Link to={`/${lang}/blog`}><Button variant="outline">Back to Blog</Button></Link>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {posts.map((post) => (
                <Link key={post.id} to={`/${lang}/blog/${post.slug || post.id}`} className="glass-card-hover group flex flex-col overflow-hidden">
                  {post.featured_image && (
                    <OptimizedImage src={post.featured_image} alt={post.title} widths={[400, 800]} className="w-full h-44" />
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">{post.category}</span>
                    <h2 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex items-start gap-1.5">
                      {post.title}
                      <ArrowUpRight size={16} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">{post.excerpt}</p>
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><User size={12} /> {t.blog.by}</span>
                      {post.read_time && <span className="inline-flex items-center gap-1"><Clock size={12} /> {post.read_time}</span>}
                      {(commentCounts[post.id] || 0) > 0 && <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {commentCounts[post.id]}</span>}
                      <span className="ml-auto">{formatDate(post.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)} className="w-9">{p}</Button>
                ))}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></Button>
              </div>
            )}

            <p className="text-center text-xs text-muted-foreground mt-4">
              Showing {(page - 1) * POSTS_PER_PAGE + 1}–{Math.min(page * POSTS_PER_PAGE, total)} of {total} posts
            </p>
          </>
        )}
      </div>
    </main>
  );
};

export default BlogTagPage;
