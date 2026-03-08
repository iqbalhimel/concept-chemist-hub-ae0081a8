import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const EducationSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("education").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setItems(data || []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="education" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.education.title_1} <span className="gradient-text">{t.education.title_highlight}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16">{t.education.subtitle}</p>
        </motion.div>
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute left-7 top-2 bottom-2 w-px bg-border/60 hidden md:block" />
          <div className="space-y-8">
            {items.map((edu, i) => (
              <motion.div key={edu.id} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }} className="glass-card-hover p-6 md:py-7 md:px-8 md:ml-16 relative">
                <div className="hidden md:flex absolute -left-[3.25rem] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/15 border-2 border-primary/70 items-center justify-center">
                  <GraduationCap size={18} className="text-primary" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                  <h3 className="font-display text-base md:text-lg font-bold text-foreground">{lang === "bn" && edu.degree_title_bn ? edu.degree_title_bn : edu.degree_title_en}</h3>
                  <span className="text-sm text-primary font-semibold tracking-wide">{edu.year}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{lang === "bn" && edu.institution_bn ? edu.institution_bn : edu.institution_en}</p>
                <p className="text-accent text-sm font-semibold mt-1.5">{edu.cgpa_or_result}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationSection;
