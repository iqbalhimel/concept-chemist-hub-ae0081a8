import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Target, Lightbulb, MonitorPlay, Heart, BookOpen, Users, Star, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ElementType> = { Lightbulb, Target, MonitorPlay, Heart, BookOpen, Users, Star, Award };

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const vp = { once: true, amount: 0.15 as const };

const ApproachSection = () => {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("teaching_approach").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setItems(data || []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="section-padding section-gradient">
      <div className="container mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.approach?.title_1 ?? ""} <span className="gradient-text">{t.approach?.title_highlight ?? ""}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">{t.approach?.subtitle ?? ""}</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {items.map((item, i) => {
            const Icon = iconMap[item?.icon ?? ""] || Lightbulb;
            const title = lang === "bn" ? (item?.title_bn || item?.title_en || "Untitled") : (item?.title_en || item?.title_bn || "Untitled");
            const desc = lang === "bn" ? (item?.description_bn || item?.description_en || "") : (item?.description_en || item?.description_bn || "");
            return (
              <motion.div key={item.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }} className="glass-card-hover p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><Icon size={24} className="text-primary" /></div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ApproachSection;
