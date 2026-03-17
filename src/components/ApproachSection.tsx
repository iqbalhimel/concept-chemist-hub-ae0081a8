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
    <section id="approach" className="section-padding section-gradient section-shell">
      <div className="container mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight">
            {t.approach?.title_1 ?? ""} <span className="gradient-text">{t.approach?.title_highlight ?? ""}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-2xl mx-auto">{t.approach?.subtitle ?? ""}</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {items.map((item, i) => {
            const Icon = iconMap[item?.icon ?? ""] || Lightbulb;
            const fallbackUntitled = t.subjects?.untitled ?? "Untitled";
            const title = lang === "bn"
              ? (item?.title_bn || item?.title_en || fallbackUntitled)
              : (item?.title_en || item?.title_bn || fallbackUntitled);
            const desc = lang === "bn" ? (item?.description_bn || item?.description_en || "") : (item?.description_en || item?.description_bn || "");
            return (
              <motion.div
                key={item.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={vp}
                transition={{ duration: 0.5, delay: 0.08 + i * 0.06 }}
                className="glass-card-hover p-6 md:p-7"
              >
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground bg-secondary/40 border border-border rounded-full px-3 py-1">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2 tracking-tight">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ApproachSection;
