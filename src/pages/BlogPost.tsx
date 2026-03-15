import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, User, Calendar, ArrowUpRight, Share2, Link2, Check } from "lucide-react";
import { setSeo, generateArticleSchema, generateBreadcrumbSchema } from "@/lib/seo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import BlogReactions from "@/components/BlogReactions";
import BlogComments from "@/components/BlogComments";
import { useLanguage } from "@/contexts/LanguageContext";
import { sanitizeHtml } from "@/lib/sanitize";
import RelatedCrossContent from "@/components/RelatedCrossContent";
import { trackContentView } from "@/lib/trackContentView";

interface BlogPostType {
  id: string;
  title: string;
  category: string;
  content: string | null;
  excerpt: string | null;
  read_time: string | null;
  featured_image?: string | null;
  created_at: string;
}

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { get } = useSiteSettings();
  const [post, setPost] = useState<(BlogPostType & { slug?: string | null }) | null>(null);
  const [related, setRelated] = useState<(BlogPostType & { slug?: string | null })[]>([]);
  const [postTagNames, setPostTagNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const fetchPost = async () => {
      if (!id) return;
      
      // Try slug first, then fall back to UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      let data: any = null;
      if (!isUUID) {
        const res = await supabase.from("blog_posts").select("*").eq("slug", id).is("trashed_at", null).single();
        data = res.data;
      }
      if (!data && isUUID) {
        const res = await supabase.from("blog_posts").select("*").eq("id", id).is("trashed_at", null).single();
        data = res.data;
        // Redirect UUID URL to slug URL
        if (data?.slug) {
          navigate(`/${lang}/blog/${data.slug}`, { replace: true });
          return;
        }
      }
      
      const p = data as (BlogPostType & { is_published?: boolean; slug?: string | null }) | null;
      setPost(p);
      setLoading(false);

      if (p) {
        trackContentView("blog_post", p.id);
      }

      if (p) {
        const postSlug = p.slug || p.id;
        const defaultOgImage = get("seo", "og_image", "");
        const autoCanonical = `https://iqbalsir.bd/blog/${postSlug}`;
        const pa = p as any;
        cleanup = setSeo({
          title: pa.seo_title || `${p.title} – Iqbal Sir's Blog`,
          description: pa.seo_description || p.excerpt || `Read "${p.title}" on Iqbal Sir's blog.`,
          url: autoCanonical,
          image: pa.seo_og_image || p.featured_image || defaultOgImage || undefined,
          keywords: pa.seo_keywords || undefined,
          canonicalUrl: pa.seo_canonical_url || autoCanonical,
          twitterTitle: pa.seo_twitter_title || undefined,
          twitterDescription: pa.seo_twitter_description || undefined,
          twitterImage: pa.seo_twitter_image || undefined,
          jsonLd: [
            generateArticleSchema(p),
            generateBreadcrumbSchema([
              { name: "Home", url: "https://iqbalsir.bd" },
              { name: "Blog", url: "https://iqbalsir.bd/blog" },
              { name: p.category, url: `https://iqbalsir.bd/blog/category/${p.category.toLowerCase().replace(/\s+/g, "-")}` },
              { name: p.title, url: autoCanonical },
            ]),
          ],
        });
        // Set OG overrides if present
        if (pa.seo_og_title) {
          const el = document.querySelector('meta[property="og:title"]') as HTMLMetaElement;
          if (el) el.content = pa.seo_og_title;
        }
        if (pa.seo_og_description) {
          const el = document.querySelector('meta[property="og:description"]') as HTMLMetaElement;
          if (el) el.content = pa.seo_og_description;
        }

        // Fetch tags and related posts in parallel
        const { data: postTags } = await supabase
          .from("post_tags")
          .select("tag_id")
          .eq("post_id", p.id);
        const tagIds = (postTags || []).map((pt: any) => pt.tag_id);

        // Start tag name resolution immediately (parallel with related posts logic)
        const tagNamesPromise = tagIds.length > 0
          ? supabase.from("tags").select("name").in("id", tagIds)
          : Promise.resolve({ data: [] });

        // Related posts: try tag-based first
        let relatedPosts: any[] = [];
        if (tagIds.length > 0) {
          const { data: sharedPostTags } = await supabase
            .from("post_tags")
            .select("post_id")
            .in("tag_id", tagIds)
            .neq("post_id", p.id);
          const relatedIds = [...new Set((sharedPostTags || []).map((pt: any) => pt.post_id))];
          if (relatedIds.length > 0) {
            const { data: tagRelated } = await supabase
              .from("blog_posts")
              .select("*")
              .eq("is_published", true)
              .is("trashed_at", null)
              .in("id", relatedIds.slice(0, 6))
              .order("sort_order", { ascending: true })
              .limit(3);
            relatedPosts = tagRelated || [];
          }
        }

        // Fallback to category if no tag matches
        if (relatedPosts.length === 0) {
          const { data: catRelated } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("is_published", true)
            .is("trashed_at", null)
            .eq("category", p.category)
            .neq("id", p.id)
            .order("sort_order", { ascending: true })
            .limit(3);
          relatedPosts = catRelated || [];
        }

        // Await tag names (already started above)
        const { data: tagRows } = await tagNamesPromise;
        setPostTagNames((tagRows || []).map((t: any) => t.name));
        setRelated(relatedPosts as (BlogPostType & { slug?: string | null })[]);
      }
    };
    fetchPost();
    window.scrollTo(0, 0);
    return () => cleanup?.();
  }, [id]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">{t.blog_post.loading}</div>
      </div>
    );
  }

  if (!post) {
    return (
      <main id="main-content" className="pt-24 pb-16">
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">{t.blog_post.not_found}</h1>
          <p className="text-muted-foreground mb-8">{t.blog_post.not_found_desc}</p>
          <Link to={`/${lang}#blog`}>
            <Button><ArrowLeft size={16} className="mr-2" /> {t.blog_post.back_blog}</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-muted/30">
        <div className="h-full bg-primary transition-[width] duration-100 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {post && !(post as any).is_published && (
        <div className="bg-accent/20 border-b border-accent text-accent-foreground text-center text-sm py-2 font-medium">
          ⚠️ {t.blog_post.draft_preview}
        </div>
      )}

      <article id="main-content" className="pt-24 pb-16">
        {post.featured_image && (
          <div className="w-full max-h-[400px] overflow-hidden mb-8">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to={`/${lang}#blog`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={14} /> {t.blog_post.back_blog}
          </Link>

          <span className="block text-xs font-semibold text-accent uppercase tracking-wider mb-3">
            {post.category}
          </span>

          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-10 pb-6 border-b border-border">
            <span className="inline-flex items-center gap-1.5">
              <User size={14} /> {t.blog.by}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} /> {formatDate(post.created_at)}
            </span>
            {post.read_time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} /> {post.read_time}
              </span>
            )}

            <div className="ml-auto flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 mr-1">
                <Share2 size={14} /> {t.blog_post.share}
              </span>
              {(() => {
                const postUrl = `https://iqbalsir.bd/blog/${post.slug || post.id}`;
                const shareUrl = encodeURIComponent(postUrl);
                const shareTitle = encodeURIComponent(post.title);
                return (
                  <>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Facebook"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on Twitter"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                    <a
                      href={`https://wa.me/?text=${shareTitle}%20${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Share on WhatsApp"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://iqbalsir.bd/blog/${post.slug || post.id}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      aria-label={t.blog_post.copy_link}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {copied ? <Check size={14} /> : <Link2 size={14} />}
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content || `<p>${t.blog_post.no_content}</p>`) }}
          />

          <div className="mt-10 pt-6 border-t border-border">
            <BlogReactions postId={post.id} />
          </div>

          <div className="mt-10 pt-6 border-t border-border">
            <BlogComments postId={post.id} />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">
              {t.blog_post.more_in} <span className="text-primary">{post.category}</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/${lang}/blog/${r.slug || r.id}`}
                  className="glass-card-hover group flex flex-col overflow-hidden"
                >
                  {r.featured_image && (
                    <div className="w-full h-36 overflow-hidden">
                      <img
                        src={r.featured_image}
                        alt={r.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
                      {r.category}
                    </span>
                    <h3 className="font-display text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex items-start gap-1.5">
                      {r.title}
                      <ArrowUpRight size={14} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 flex-1">{r.excerpt}</p>
                    {r.read_time && (
                      <span className="inline-flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                        <Clock size={12} /> {r.read_time}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {post && (
        <RelatedCrossContent postCategory={post.category} postTags={postTagNames} />
      )}

    </>
  );
};

export default BlogPost;
