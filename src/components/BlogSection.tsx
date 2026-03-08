import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ArrowUpRight, Clock, User, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface BlogPost {
  id: string;
  title: string;
  category: string;
  excerpt: string | null;
  read_time: string | null;
  featured_image?: string | null;
}

const fallbackPosts: BlogPost[] = [
  {
    id: "fallback-1",
    title: "Understanding Newton's Laws of Motion",
    category: "Physics",
    excerpt: "A beginner-friendly guide to the three fundamental laws that govern how objects move and interact.",
    read_time: "5 min read",
  },
  {
    id: "fallback-2",
    title: "The Periodic Table Made Easy",
    category: "Chemistry",
    excerpt: "Tips and tricks to memorize the periodic table and understand element properties effectively.",
    read_time: "4 min read",
  },
  {
    id: "fallback-3",
    title: "5 Study Strategies for Science Exams",
    category: "Study Tips",
    excerpt: "Proven techniques to improve retention, manage time, and score higher in board examinations.",
    read_time: "6 min read",
  },
];

const BlogSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [posts, setPosts] = useState<BlogPost[]>(fallbackPosts);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .limit(3);
      if (data && data.length > 0) {
        setPosts(data as BlogPost[]);
      }
    };
    fetchPosts();
  }, []);

  return (
    <section id="blog" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            Educational <span className="gradient-text">Blog</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Articles and tips to help students learn science more effectively
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {posts.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className="glass-card-hover group cursor-pointer flex flex-col overflow-hidden"
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
              <div className="p-8 flex flex-col flex-1">
                <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">
                  {post.category}
                </span>
                <h3 className="font-display text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors flex items-start gap-2">
                  {post.title}
                  <ArrowUpRight size={18} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">{post.excerpt}</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><User size={12} /> Iqbal Sir</span>
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> {post.read_time}</span>
                </div>
                <Link to={`/blog/${post.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline transition-all">
                  Read Article <ArrowUpRight size={14} />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 text-primary font-semibold hover:bg-primary/20 transition-colors"
          >
            View All Posts <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
