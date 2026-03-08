import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Quote, Star, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Testimonial {
  id: string;
  student_name: string;
  student_info: string;
  testimonial_text_en: string;
  testimonial_text_bn: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const HOMEPAGE_LIMIT = 5;

const TestimonialsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase
          .from("testimonials")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(HOMEPAGE_LIMIT),
        supabase
          .from("testimonials")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true),
      ]);
      setItems((data as Testimonial[]) || []);
      setTotalCount(count || 0);
      setLoaded(true);
    };
    fetchData();
  }, []);

  if (loaded && items.length === 0) return null;

  return (
    <section id="testimonials" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">{t.testimonials.badge}</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t.testimonials.title_1} <span className="gradient-text">{t.testimonials.title_highlight}</span></h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t.testimonials.subtitle}</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {items.map((item, i) => {
            const text = lang === "bn" && item.testimonial_text_bn
              ? item.testimonial_text_bn
              : item.testimonial_text_en || item.testimonial_text_bn;

            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }} className="glass-card-hover p-6 flex flex-col gap-4">
                <Quote size={24} className="text-primary/40" />
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">"{text}"</p>
                <div className="flex items-center gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} className={s < item.rating ? "fill-current" : "opacity-20"} />
                  ))}
                </div>
                <div className="border-t border-border pt-3">
                  <p className="font-medium text-foreground text-sm">{item.student_name}</p>
                  <p className="text-xs text-muted-foreground">{item.student_info}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        {totalCount > HOMEPAGE_LIMIT && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.6 }} className="text-center mt-10">
            <Link
              to={`/${lang}/testimonials`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all glow-primary"
            >
              {t.testimonials.see_all}
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
