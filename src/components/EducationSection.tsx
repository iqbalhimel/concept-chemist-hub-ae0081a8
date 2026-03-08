import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { GraduationCap } from "lucide-react";

const education = [
  { degree: "B.Ed", institution: "National University", result: "CGPA 3.77", year: "2023" },
  { degree: "MS in Physical Chemistry", institution: "University of Chittagong", result: "CGPA 3.36", year: "2017" },
  { degree: "BSc (Honours) in Chemistry", institution: "University of Chittagong", result: "CGPA 3.27", year: "2016" },
  { degree: "HSC – Science", institution: "Govt. Gurudayal College", result: "GPA 5.00 · Dhaka Board", year: "2011" },
  { degree: "SSC – Science", institution: "Shimulia High School", result: "GPA 5.00 · Dhaka Board", year: "2009" },
];

const EducationSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="education" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            Academic <span className="gradient-text">Education</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16">A strong academic foundation in science</p>
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-6">
            {education.map((edu, i) => (
              <motion.div
                key={edu.degree}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="glass-card-hover p-6 md:ml-14 relative"
              >
                <div className="hidden md:flex absolute -left-[3.65rem] top-6 w-10 h-10 rounded-full bg-primary/20 border-2 border-primary items-center justify-center">
                  <GraduationCap size={18} className="text-primary" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                  <h3 className="font-display font-bold text-foreground">{edu.degree}</h3>
                  <span className="text-sm text-primary font-medium">{edu.year}</span>
                </div>
                <p className="text-muted-foreground text-sm">{edu.institution}</p>
                <p className="text-accent text-sm font-semibold mt-1">{edu.result}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationSection;
