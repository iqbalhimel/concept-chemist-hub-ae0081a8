import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Award, FlaskConical, Monitor, Lightbulb, BookOpen, GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ElementType> = {
  Award, FlaskConical, Monitor, Lightbulb, BookOpen, GraduationCap,
};

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const vp = { once: true, amount: 0.15 as const };

const ProfessionalTrainingSection = () => {
  const { lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("professional_training")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setItems(data || []));
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="professional-training" className="section-padding">
      <div className="container mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            Professional <span className="gradient-text">Training</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16">Specialized training and certifications</p>
        </motion.div>
        <div className="max-w-3xl mx-auto space-y-6">
          {items.map((item, i) => {
            const title = lang === "bn" ? (item.title_bn || item.title_en) : (item.title_en || item.title_bn);
            const Icon = iconMap[item.icon] || Award;
            return (
              <motion.div key={item.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }} className="glass-card-hover p-8 flex gap-6 items-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon size={24} className="text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProfessionalTrainingSection;
