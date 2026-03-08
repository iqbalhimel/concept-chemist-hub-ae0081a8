import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Atom, FlaskConical, Leaf, Calculator, Binary, BookMarked, Monitor } from "lucide-react";

const subjectGroups = [
  {
    level: "SSC Level",
    subjects: [
      { name: "Physics", icon: Atom },
      { name: "Chemistry", icon: FlaskConical },
      { name: "Biology", icon: Leaf },
    ],
  },
  {
    level: "HSC Level",
    subjects: [{ name: "Chemistry", icon: FlaskConical }],
  },
  {
    level: "Class 6–10",
    subjects: [
      { name: "Mathematics", icon: Calculator },
      { name: "Higher Mathematics", icon: Binary },
      { name: "General Science", icon: BookMarked },
      { name: "ICT", icon: Monitor },
    ],
  },
];

const SubjectsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="subjects" className="section-padding">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            Teaching <span className="gradient-text">Subjects</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Comprehensive science and mathematics education across multiple levels
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {subjectGroups.map((group, gi) => (
            <motion.div
              key={group.level}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + gi * 0.15 }}
              className="glass-card-hover p-8"
            >
              <h3 className="font-display text-lg font-bold text-primary mb-6">{group.level}</h3>
              <div className="space-y-4">
                {group.subjects.map((sub) => (
                  <div key={sub.name} className="flex items-center gap-3">
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
