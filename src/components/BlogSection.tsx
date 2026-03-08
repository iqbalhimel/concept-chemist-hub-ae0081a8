import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ArrowUpRight, Clock, User, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface BlogPost { id: string; title: string; category: string; excerpt: string | null; read_time: string | null; featured_image?: string | null; }

const BlogSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const { lang, t } = useLanguage();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase.from("blog_posts").select("*").eq("is_published", true).order("sort_order", { ascending: true }).limit(3);
      if (data && data.length > 0) {
        setPosts(data as BlogPost[]);
        const ids = data.map((d: any) => d.id);
        const { data: cData } = await supabase.from("blog_post_comments").select("post_id").in("post_id", ids);
        if (cData) { const counts: Record<string, number> = {}; cData.forEach((c: any) => { counts[c.post_id] = (counts[c.post_id] || 0) + 1; }); setCommentCounts(counts); }
      }
    };
    fetchPosts();
  }, []);

  return (
    <section id="blog" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">{t.blog.title_1} <span className="gradient-text">{t.blog.title_highlight}</span></h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">{t.blog.subtitle}</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {posts.map((post, i) => (
            <motion.article key={post.id} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }} className="glass-card-hover group cursor-pointer flex flex-col overflow-hidden">
              {post.featured_image && <div className="w-full h-44 overflow-hidden"><img src={post.featured_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" /></div>}
              <div className="p-8 flex flex-col flex-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">{post.category}</span>
                <h3 className="font-display text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors flex items-start gap-2">{post.title}<ArrowUpRight size={18} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary" /></h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">{post.excerpt}</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><User size={12} /> {t.blog.by}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> {post.read_time}</span>
                  {(commentCounts[post.id] || 0) > 0 && <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {commentCounts[post.id]}</span>}
                </div>
                <Link to={`/${lang}/blog/${post.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-all">{t.blog.read_article} <ArrowUpRight size={14} /></Link>
              </div>
            </motion.article>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to={`/${lang}/blog`} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors">{t.blog.view_all} <ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
