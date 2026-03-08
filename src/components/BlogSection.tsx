import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, Clock, User } from "lucide-react";

const posts = [
  {
    title: "Understanding Newton's Laws of Motion",
    category: "Physics",
    excerpt: "A beginner-friendly guide to the three fundamental laws that govern how objects move and interact.",
    readTime: "5 min read",
  },
  {
    title: "The Periodic Table Made Easy",
    category: "Chemistry",
    excerpt: "Tips and tricks to memorize the periodic table and understand element properties effectively.",
    readTime: "4 min read",
  },
  {
    title: "5 Study Strategies for Science Exams",
    category: "Study Tips",
    excerpt: "Proven techniques to improve retention, manage time, and score higher in board examinations.",
    readTime: "6 min read",
  },
];

const BlogSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

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
              key={post.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className="glass-card-hover p-8 group cursor-pointer flex flex-col"
            >
              <span className="text-xs font-semibold text-accent uppercase tracking-wider mb-3">
                {post.category}
              </span>
              <h3 className="font-display text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors flex items-start gap-2">
                {post.title}
                <ArrowUpRight size={18} className="shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">{post.excerpt}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
