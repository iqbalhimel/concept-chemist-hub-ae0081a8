import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, Download, BookOpen, ClipboardList } from "lucide-react";

const resources = [
  { icon: FileText, title: "Study Notes", desc: "Comprehensive handwritten and typed notes for SSC and HSC science subjects." },
  { icon: Download, title: "PDF Study Guides", desc: "Downloadable PDF guides covering key topics and exam-focused content." },
  { icon: BookOpen, title: "Concept Explanations", desc: "In-depth explanations of complex science concepts made simple." },
  { icon: ClipboardList, title: "Exam Preparation", desc: "Practice materials, question banks, and exam strategies for board exams." },
];

const ResourcesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="resources" className="section-padding">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            Student <span className="gradient-text">Resources</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            Free study materials to help you excel in your exams
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {resources.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="glass-card-hover p-8 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <item.icon size={24} className="text-accent" />
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

export default ResourcesSection;
