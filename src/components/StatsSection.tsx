import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useEffect, useState } from "react";

const stats = [
  { value: 10, suffix: "+", label: "Years of Teaching" },
  { value: 8, suffix: "+", label: "Subjects Taught" },
  { value: 500, suffix: "+", label: "Students Taught" },
];

const AnimatedCounter = ({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const stepTime = Math.max(Math.floor(duration / target), 20);
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= target) clearInterval(timer);
    }, stepTime);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span className="font-display text-4xl md:text-5xl font-bold gradient-text">
      {count}{suffix}
    </span>
  );
};

const StatsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <section className="section-padding">
      <div className="container mx-auto" ref={ref}>
        <div className="glass-card p-10 md:p-16 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5 }}
              >
                <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={inView} />
                <p className="text-muted-foreground mt-2 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
