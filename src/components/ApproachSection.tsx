import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Target, Lightbulb, MonitorPlay, Heart } from "lucide-react";

const approaches = [
  { icon: Target, title: "Strong Basic Concepts", desc: "Building a solid foundation by focusing on core principles and fundamentals of every topic." },
  { icon: Lightbulb, title: "Clear Explanations", desc: "Breaking down complex and difficult topics into simple, understandable language." },
  { icon: MonitorPlay, title: "Multimedia Classes", desc: "Using projector-based multimedia presentations for visual and engaging learning." },
  { icon: Heart, title: "Student-Friendly Environment", desc: "Creating a comfortable and supportive atmosphere where every student can thrive." },
];

const ApproachSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            Teaching <span className="gradient-text">Approach</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
            A philosophy built on clarity, engagement, and student success
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {approaches.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="glass-card-hover p-8"
            >
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
