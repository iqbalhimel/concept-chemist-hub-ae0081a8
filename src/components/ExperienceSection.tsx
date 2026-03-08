import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Briefcase } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const ExperienceSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("experience").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setItems(data || []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="experience" className="section-padding">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.experience.title_1} <span className="gradient-text">{t.experience.title_highlight}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16">{t.experience.subtitle}</p>
        </motion.div>
        <div className="max-w-3xl mx-auto space-y-6">
          {items.map((exp, i) => (
            <motion.div key={exp.id} initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }} className="glass-card-hover p-8 flex gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Briefcase size={24} className="text-primary" /></div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">{lang === "bn" && exp.job_title_bn ? exp.job_title_bn : exp.job_title_en}</h3>
                <p className="text-primary text-sm font-medium mb-1">{lang === "bn" && exp.institution_bn ? exp.institution_bn : exp.institution_en}</p>
                <p className="text-muted-foreground text-sm mb-2">{lang === "bn" && exp.duration_bn ? exp.duration_bn : exp.duration_en}</p>
                <p className="text-secondary-foreground">{lang === "bn" && exp.description_bn ? exp.description_bn : exp.description_en}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
