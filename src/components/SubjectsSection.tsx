import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Atom, FlaskConical, Leaf, Calculator, Binary, BookMarked, Monitor } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const SubjectsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  const subjectGroups = [
    {
      level: t.subjects.ssc,
      subjects: [
        { name: t.subjects.physics, icon: Atom },
        { name: t.subjects.chemistry, icon: FlaskConical },
        { name: t.subjects.biology, icon: Leaf },
      ],
    },
    {
      level: t.subjects.hsc,
      subjects: [{ name: t.subjects.chemistry, icon: FlaskConical }],
    },
    {
      level: t.subjects.class610,
      subjects: [
        { name: t.subjects.mathematics, icon: Calculator },
        { name: t.subjects.higher_math, icon: Binary },
        { name: t.subjects.general_science, icon: BookMarked },
        { name: t.subjects.ict, icon: Monitor },
      ],
    },
  ];

  return (
    <section id="subjects" className="section-padding">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.subjects.title_1} <span className="gradient-text">{t.subjects.title_highlight}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">{t.subjects.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {subjectGroups.map((group, gi) => (
            <motion.div key={gi} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + gi * 0.15 }} className="glass-card-hover p-8">
              <h3 className="font-display text-lg font-bold text-primary mb-6">{group.level}</h3>
              <div className="space-y-4">
                {group.subjects.map((sub, si) => (
                  <div key={si} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <sub.icon size={20} className="text-primary" />
                    </div>
                    <span className="text-foreground font-medium">{sub.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubjectsSection;
