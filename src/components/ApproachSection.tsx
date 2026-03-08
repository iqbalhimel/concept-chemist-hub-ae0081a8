import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Target, Lightbulb, MonitorPlay, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ApproachSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  const approaches = [
    { icon: Target, title: t.approach.item_1_title, desc: t.approach.item_1_desc },
    { icon: Lightbulb, title: t.approach.item_2_title, desc: t.approach.item_2_desc },
    { icon: MonitorPlay, title: t.approach.item_3_title, desc: t.approach.item_3_desc },
    { icon: Heart, title: t.approach.item_4_title, desc: t.approach.item_4_desc },
  ];

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
          {approaches.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }} className="glass-card-hover p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <item.icon size={24} className="text-primary" />
              </div>
              <h3 className="font-display text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ApproachSection;
