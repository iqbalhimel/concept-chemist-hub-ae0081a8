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
    const fetch = async () => {
      try {
        const { data, error } = await supabase.from("teaching_approach").select("*").eq("is_active", true).order("sort_order");
        if (error) { console.error("ApproachSection error:", error); return; }
        if (!Array.isArray(data)) { console.warn("ApproachSection: non-array data", data); return; }
        const valid = data.filter(item => item && typeof item === "object" && item.id);
        console.log("ApproachSection: loaded", valid.length, "items");
        setItems(valid);
      } catch (e) { console.error("ApproachSection exception:", e); }
    };
    fetch();
  }, []);

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.approach?.title_1 ?? ""} <span className="gradient-text">{t.approach?.title_highlight ?? ""}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">{t.approach?.subtitle ?? ""}</p>
        </motion.div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {items.map((item, i) => {
            const Icon = iconMap[item?.icon ?? ""] || Lightbulb;
            const title = lang === "bn"
              ? (item?.title_bn || item?.title_en || "Untitled")
              : (item?.title_en || item?.title_bn || "Untitled");
            const desc = lang === "bn"
              ? (item?.description_bn || item?.description_en || "")
              : (item?.description_en || item?.description_bn || "");
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }} className="glass-card-hover p-8">
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
