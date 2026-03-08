import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { GraduationCap, Users, Trophy, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AnimatedCounter = ({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const stepTime = Math.max(Math.floor(duration / target), 16);
    const timer = setInterval(() => { start += 1; setCount(start); if (start >= target) clearInterval(timer); }, stepTime);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span className="font-display text-4xl md:text-5xl font-bold gradient-text">{count}{suffix}</span>;
};

const StatsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { t } = useLanguage();

  const stats = [
    { value: 10, suffix: "+", label: t.stats.years, icon: Clock },
    { value: 5000, suffix: "+", label: t.stats.students, icon: Users },
    { value: 90, suffix: "%+", label: t.stats.success, icon: Trophy },
    { value: 8, suffix: "+", label: t.stats.subjects_covered, icon: GraduationCap },
  ];

  return (
    <section id="student-success" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">{t.stats.badge}</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold">
            {t.stats.title_1} <span className="gradient-text">{t.stats.title_highlight}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }} className="glass-card-hover p-6 md:p-8 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-1"><Icon size={24} className="text-primary" /></div>
                <AnimatedCounter target={stat.value} suffix={stat.suffix} inView={inView} />
                <p className="text-muted-foreground text-sm font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
