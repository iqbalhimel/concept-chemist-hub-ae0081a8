import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { GraduationCap, Users, Trophy, Clock, Star, Award, Target, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ElementType> = { Trophy, Clock, Users, GraduationCap, Star, Award, Target, BookOpen };

const AnimatedCounter = ({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const stepTime = Math.max(Math.floor(duration / target), 16);
    const timer = setInterval(() => { start += 1; setCount(start); if (start >= target) clearInterval(timer); }, stepTime);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span className="font-display text-4xl md:text-5xl font-bold gradient-text">{count}{suffix}</span>;
};

const StatsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("achievements").select("*").eq("is_active", true).order("sort_order").then(({ data, error }) => {
      console.log('StatsSection data:', data, 'error:', error);
      setItems(data || []);
    });
  }, []);

  if (!items || items.length === 0) {
    console.log('StatsSection: No items to display');
    return null;
  }
  console.log('StatsSection rendering with items:', items.length);

  return (
    <section id="student-success" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">{t.stats.badge}</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            {t.stats.title_1} <span className="gradient-text">{t.stats.title_highlight}</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {items.map((stat, i) => {
            const Icon = iconMap[stat.icon] || Trophy;
            const numMatch = stat.value.match(/^(\d+)/);
            const num = numMatch ? parseInt(numMatch[1]) : 0;
            const suffix = stat.value.replace(/^\d+/, "");
            return (
              <motion.div key={stat.id} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }} className="glass-card-hover p-6 md:p-8 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-1"><Icon size={24} className="text-primary" /></div>
                <AnimatedCounter target={num} suffix={suffix} inView={inView} />
                <p className="text-muted-foreground text-sm font-medium">{lang === "bn" && stat.title_bn ? stat.title_bn : stat.title_en}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
