import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BookOpen, Monitor, Users, Lightbulb } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AboutSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  const highlights = [
    { icon: BookOpen, label: t.about.highlight_1 },
    { icon: Monitor, label: t.about.highlight_2 },
    { icon: Users, label: t.about.highlight_3 },
    { icon: Lightbulb, label: t.about.highlight_4 },
  ];

  return (
    <section id="about" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.about.title_1} <span className="gradient-text">{t.about.title_highlight}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">{t.about.subtitle}</p>

          <div className="glass-card p-8 md:p-12 mb-10">
            <p className="text-secondary-foreground leading-relaxed text-lg mb-6" dangerouslySetInnerHTML={{ __html: t.about.intro }} />
            <ul className="space-y-3 text-secondary-foreground text-base">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: t.about.point_1 }} />
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-accent shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: t.about.point_2 }} />
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                <span>{t.about.point_3}</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {highlights.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }} className="glass-card-hover p-5 text-center">
                <item.icon className="mx-auto mb-3 text-primary" size={28} />
                <p className="text-sm font-medium text-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
