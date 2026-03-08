import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Target, Lightbulb, MonitorPlay, Heart, BookOpen, Users, Star, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ElementType> = { Lightbulb, Target, MonitorPlay, Heart, BookOpen, Users, Star, Award };

const ApproachSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("teaching_approach").select("*").eq("is_active", true).order("sort_order").then(({ data, error }) => {
      console.log('ApproachSection data:', data, 'error:', error);
      setItems(data || []);
    });
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.approach.title_1} <span className="gradient-text">{t.approach.title_highlight}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">{t.approach.subtitle}</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {items.map((item, i) => {
            const Icon = iconMap[item.icon] || Lightbulb;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }} className="glass-card-hover p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><Icon size={24} className="text-primary" /></div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{lang === "bn" && item.title_bn ? item.title_bn : item.title_en}</h3>
                <p className="text-muted-foreground leading-relaxed">{lang === "bn" && item.description_bn ? item.description_bn : item.description_en}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ApproachSection;
