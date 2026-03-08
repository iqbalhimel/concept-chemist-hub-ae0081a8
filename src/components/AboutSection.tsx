import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { BookOpen, Monitor, Users, Lightbulb } from "lucide-react";

const highlights = [
  { icon: BookOpen, label: "Concept-Based Learning" },
  { icon: Monitor, label: "Multimedia Classes" },
  { icon: Users, label: "Student-Friendly" },
  { icon: Lightbulb, label: "Strong Fundamentals" },
];

const AboutSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            About <span className="gradient-text">Iqbal Sir</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            MD. IQBAL HUSEN — Assistant Teacher (Science) & Science Educator
          </p>

          <div className="glass-card p-8 md:p-12 mb-10">
            <p className="text-secondary-foreground leading-relaxed text-lg mb-6">
              A passionate science educator who has been teaching students since 2014.
              Currently serving as <strong className="text-foreground">Assistant Teacher (Science)</strong> at
              Zilla Smarani Girls' High School, Kishoreganj, Iqbal Sir is dedicated to
              making science simple and interesting through concept-based learning.
            </p>
            <p className="text-secondary-foreground leading-relaxed text-lg">
              With a strong emphasis on building fundamentals, clear explanations of difficult topics,
              and multimedia projector-based classes, he creates a student-friendly learning environment
              that helps students truly understand and love science.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {highlights.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="glass-card-hover p-5 text-center"
              >
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
