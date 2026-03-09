import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Briefcase } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const vp = { once: true, amount: 0.15 as const };

const ExperienceSection = () => {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("experience").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setItems(data || []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="experience" className="section-padding">
      <div className="container mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.experience?.title_1 ?? ""} <span className="gradient-text">{t.experience?.title_highlight ?? ""}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16">{t.experience?.subtitle ?? ""}</p>
        </motion.div>
        <div className="max-w-3xl mx-auto space-y-6">
          {items.map((exp, i) => {
            const jobTitle = lang === "bn" ? (exp?.job_title_bn || exp?.job_title_en || "Position") : (exp?.job_title_en || exp?.job_title_bn || "Position");
            const institution = lang === "bn" ? (exp?.institution_bn || exp?.institution_en || "") : (exp?.institution_en || exp?.institution_bn || "");
            const duration = lang === "bn" ? (exp?.duration_bn || exp?.duration_en || "") : (exp?.duration_en || exp?.duration_bn || "");
            const desc = lang === "bn" ? (exp?.description_bn || exp?.description_en || "") : (exp?.description_en || exp?.description_bn || "");
            return (
              <motion.div key={exp.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }} className="glass-card-hover p-8 flex gap-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Briefcase size={24} className="text-primary" /></div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{jobTitle}</h3>
                  <p className="text-primary text-sm font-medium mb-1">{institution}</p>
                  <p className="text-muted-foreground text-sm mb-2">{duration}</p>
                  <p className="text-secondary-foreground">{desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
