import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const testimonials = [
  { name: "Rafiq Ahmed", exam: "SSC 2024 · GPA 5.00", text: "Iqbal Sir's concept-based teaching completely changed how I understand Physics. Instead of memorising formulas, I actually learned the 'why' behind them." },
  { name: "Fatima Akter", exam: "HSC 2023 · GPA 5.00", text: "Chemistry felt impossible until I joined Iqbal Sir's batch. His multimedia approach and real-life examples made even Organic Chemistry enjoyable." },
  { name: "Tanvir Hasan", exam: "SSC 2024 · GPA 5.00", text: "The model tests and board question practice sessions were a game-changer. I went into my SSC exams feeling fully prepared and confident." },
  { name: "Nusrat Jahan", exam: "HSC 2023 · GPA 4.92", text: "What I love most is how Sir makes sure every student understands before moving on. The small batch sizes really help with personal attention." },
  { name: "Ariful Islam", exam: "SSC 2024 · GPA 5.00", text: "The free notes and question banks are incredibly well-organised. Iqbal Sir goes above and beyond to support his students even outside class hours." },
];

const TestimonialsSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useLanguage();

  return (
    <section id="testimonials" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">{t.testimonials.badge}</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t.testimonials.title_1} <span className="gradient-text">{t.testimonials.title_highlight}</span></h2>
          <p className="text-muted-foreground max-w-xl mx-auto">{t.testimonials.subtitle}</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {testimonials.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }} className="glass-card-hover p-6 flex flex-col gap-4">
              <Quote size={24} className="text-primary/40" />
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">"{item.text}"</p>
              <div className="flex items-center gap-1 text-primary">{Array.from({length:5}).map((_,s)=><Star key={s} size={14} fill="currentColor"/>)}</div>
              <div className="border-t border-border pt-3"><p className="font-medium text-foreground text-sm">{item.name}</p><p className="text-xs text-muted-foreground">{item.exam}</p></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
