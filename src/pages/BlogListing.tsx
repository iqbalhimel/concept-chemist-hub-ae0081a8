import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, Clock, User, ChevronLeft, ChevronRight, MessageSquare, Search, X } from "lucide-react";
import { setSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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

const BlogListing = () => {
  const { lang, t } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [filterCat, setFilterCat] = useState("__all__");
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const cleanup = setSeo({
      title: "Blog – Iqbal Sir | Science Education Articles & Tips",
      description: "Browse all articles and tips on physics, chemistry, biology and SSC/HSC exam preparation by Iqbal Sir.",
      url: "https://iqbalsir.com/blog",
      type: "website",
    });
    return cleanup;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      let query = supabase
        .from("blog_posts")
        .select("*", { count: "exact" })
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      if (filterCat !== "__all__") {
        query = query.eq("category", filterCat);
      }

      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`;
        query = query.or(`title.ilike.${q},excerpt.ilike.${q}`);
      }

      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      const { data, count } = await query.range(from, to);

      setPosts((data as BlogPost[]) || []);
      setTotal(count || 0);

      if (data && data.length > 0) {
        const ids = data.map((d: any) => d.id);
        const { data: cData } = await supabase
          .from("blog_post_comments")
          .select("post_id")
          .in("post_id", ids);
        if (cData) {
          const counts: Record<string, number> = {};
          cData.forEach((c: any) => { counts[c.post_id] = (counts[c.post_id] || 0) + 1; });
          setCommentCounts(counts);
        }
      }

      setLoading(false);
    };
    fetchPosts();
  }, [page, filterCat, searchQuery]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("category")
        .eq("is_published", true);
      if (data) {
        const cats = [...new Set(data.map((d) => d.category))].sort();
        setCategories(cats);
      }
    };
    fetchCategories();
  }, []);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              {t.blog_listing.title_all} <span className="gradient-text">{t.blog_listing.title_highlight}</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t.blog_listing.subtitle}
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10 h-11 rounded-full bg-muted/50 border-border"
                placeholder={t.blog_listing.search_placeholder}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              />
              {searchQuery && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearchQuery(""); setPage(1); }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              <button
                onClick={() => { setFilterCat("__all__"); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterCat === "__all__"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.blog_listing.all_categories}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setFilterCat(cat); setPage(1); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterCat === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center text-muted-foreground py-20">{t.blog_listing.loading}</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <p className="text-lg mb-4">{t.blog_listing.no_results}</p>
              <Link to={`/${lang}`}>
                <Button variant="outline">{t.blog_listing.back}</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/${lang}/blog/${post.id}`}
                    className="glass-card-hover group flex flex-col overflow-hidden"
                  >
                    {post.featured_image && (
                      <div className="w-full h-44 overflow-hidden">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-2">
                        {post.category}
                      </span>
                      <h2 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors flex items-start gap-1.5">
                        {post.title}
                        <ArrowUpRight size={16} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <User size={12} /> {t.blog.by}
                        </span>
                        {post.read_time && (
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} /> {post.read_time}
                          </span>
                        )}
                        {(commentCounts[post.id] || 0) > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare size={12} /> {commentCounts[post.id]}
                          </span>
                        )}
                        <span className="ml-auto">{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(p)}
                      className="w-9"
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground mt-4">
                {t.blog_listing.showing} {(page - 1) * POSTS_PER_PAGE + 1}–{Math.min(page * POSTS_PER_PAGE, total)} {t.blog_listing.of} {total} {t.blog_listing.posts}
              </p>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogListing;
