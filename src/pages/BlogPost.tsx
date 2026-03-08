import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Clock, User, Calendar, ArrowUpRight } from "lucide-react";
import { setSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface BlogPost {
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
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();
      const p = data as BlogPost | null;
      setPost(p);
      setLoading(false);

      if (p) {
        const { data: rel } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("is_published", true)
          .eq("category", p.category)
          .neq("id", p.id)
          .order("created_at", { ascending: false })
          .limit(3);
        setRelated((rel as BlogPost[]) || []);
      }
    };
    fetchPost();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-32 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">Post Not Found</h1>
          <p className="text-muted-foreground mb-8">This blog post doesn't exist or has been unpublished.</p>
          <Link to="/#blog">
            <Button><ArrowLeft size={16} className="mr-2" /> Back to Blog</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <article className="pt-24 pb-16">
        {/* Hero / Featured Image */}
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
          {/* Back link */}
          <Link
            to="/#blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to Blog
          </Link>

          {/* Category */}
          <span className="block text-xs font-semibold text-accent uppercase tracking-wider mb-3">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-10 pb-6 border-b border-border">
            <span className="inline-flex items-center gap-1.5">
              <User size={14} /> Iqbal Sir
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} /> {formattedDate}
            </span>
            {post.read_time && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} /> {post.read_time}
              </span>
            )}
          </div>

          {/* Content */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: post.content || "<p>No content available.</p>" }}
          />
        </div>
      </article>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="pb-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-display text-2xl font-bold text-foreground mb-8">
              More in <span className="text-primary">{post.category}</span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/blog/${r.id}`}
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

      <Footer />
    </div>
  );
};

export default BlogPost;
