import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { GraduationCap, Users, Trophy, Clock, Star, Award, Target, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import CountUp from "react-countup";

const iconMap: Record<string, React.ElementType> = { Trophy, Clock, Users, GraduationCap, Star, Award, Target, BookOpen };

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const vp = { once: true, amount: 0.15 as const };

const StatsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("achievements").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setItems(data || []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="student-success" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.5 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">{t.stats?.badge ?? ""}</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            {t.stats?.title_1 ?? ""} <span className="gradient-text">{t.stats?.title_highlight ?? ""}</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {items.map((stat, i) => {
            const Icon = iconMap[stat?.icon ?? ""] || Trophy;
            const valueStr = String(stat?.value ?? "0");
            const numMatch = valueStr.match(/^(\d+)/);
            const num = numMatch ? parseInt(numMatch[1], 10) : 0;
            const suffix = valueStr.replace(/^\d+/, "");
            const title = lang === "bn" ? (stat?.title_bn || stat?.title_en || "Achievement") : (stat?.title_en || stat?.title_bn || "Achievement");
            return (
              <motion.div key={stat.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.5, delay: i * 0.1 }} className="glass-card-hover p-6 md:p-8 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-1"><Icon size={24} className="text-primary" /></div>
                <AnimatedCounter target={num} suffix={suffix} inView={inView} />
                <p className="text-muted-foreground text-sm font-medium">{title}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
