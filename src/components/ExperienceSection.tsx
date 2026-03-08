import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Briefcase } from "lucide-react";

const experiences = [
  {
    role: "Assistant Teacher (Science)",
    org: "Zilla Smarani Girls' High School, Kishoreganj",
    period: "2021 – Present",
    desc: "Teaching science subjects with multimedia and concept-based learning methods.",
  },
  {
    role: "Private Tutor",
    org: "SSC & HSC Students",
    period: "2014 – Present",
    desc: "Over a decade of private tutoring experience across Physics, Chemistry, Biology, and Mathematics.",
  },
];

const ExperienceSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="experience" className="section-padding">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            Professional <span className="gradient-text">Experience</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16">Dedicated to teaching since 2014</p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-6">
          {experiences.map((exp, i) => (
            <motion.div
              key={exp.role}
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
              className="glass-card-hover p-8 flex gap-6"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Briefcase size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">{exp.role}</h3>
                <p className="text-primary text-sm font-medium mb-1">{exp.org}</p>
                <p className="text-muted-foreground text-sm mb-2">{exp.period}</p>
                <p className="text-secondary-foreground">{exp.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceSection;
