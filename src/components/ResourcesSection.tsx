import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Atom, FlaskConical, Calculator, FileQuestion, ClipboardCheck, Download, FolderOpen } from "lucide-react";

const categories = [
  {
    id: "physics",
    label: "Physics Notes",
    icon: Atom,
    tag: "Physics",
    items: [
      { title: "Motion & Force – Complete Notes", pages: 24, size: "3.2 MB" },
      { title: "Light & Optics – SSC Guide", pages: 18, size: "2.4 MB" },
      { title: "Electricity & Magnetism", pages: 22, size: "2.9 MB" },
      { title: "Heat & Thermodynamics", pages: 16, size: "1.8 MB" },
    ],
  },
  {
    id: "chemistry",
    label: "Chemistry Notes",
    icon: FlaskConical,
    tag: "Chemistry",
    items: [
      { title: "Periodic Table & Elements", pages: 20, size: "2.6 MB" },
      { title: "Chemical Bonding – HSC", pages: 28, size: "3.8 MB" },
      { title: "Organic Chemistry Basics", pages: 32, size: "4.5 MB" },
      { title: "Acid, Base & Salt – SSC", pages: 14, size: "1.6 MB" },
    ],
  },
  {
    id: "math",
    label: "Mathematics Notes",
    icon: Calculator,
    tag: "Math",
    items: [
      { title: "Algebra Fundamentals", pages: 26, size: "3.0 MB" },
      { title: "Geometry & Mensuration", pages: 22, size: "2.7 MB" },
      { title: "Trigonometry – Complete Guide", pages: 30, size: "3.6 MB" },
      { title: "Higher Math – Integration", pages: 34, size: "4.2 MB" },
    ],
  },
  {
    id: "questions",
    label: "Board Question Bank",
    icon: FileQuestion,
    tag: "Mixed",
    items: [
      { title: "SSC Physics – Board Questions (2018-2024)", pages: 40, size: "5.1 MB" },
      { title: "SSC Chemistry – Board Questions (2018-2024)", pages: 38, size: "4.8 MB" },
      { title: "HSC Chemistry – Board Questions (2019-2024)", pages: 44, size: "5.6 MB" },
      { title: "SSC Biology – Board Questions (2018-2024)", pages: 36, size: "4.4 MB" },
    ],
  },
  {
    id: "model",
    label: "Model Tests",
    icon: ClipboardCheck,
    tag: "Mixed",
    items: [
      { title: "SSC Physics – Model Test Set 1-5", pages: 20, size: "2.5 MB" },
      { title: "SSC Chemistry – Model Test Set 1-5", pages: 20, size: "2.4 MB" },
      { title: "HSC Chemistry – Model Test Set 1-5", pages: 24, size: "3.0 MB" },
      { title: "SSC Math – Model Test Set 1-5", pages: 18, size: "2.1 MB" },
    ],
  },
];

const tagColors: Record<string, string> = {
  Physics: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  Chemistry: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Math: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Mixed: "bg-primary/10 text-primary border-primary/20",
};

const ResourcesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeCategory, setActiveCategory] = useState("physics");

  const active = categories.find((c) => c.id === activeCategory)!;

  return (
    <section id="resources" className="section-padding section-gradient">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            Free Study Materials
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Download <span className="gradient-text">Center</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Access organized notes, question banks, and model tests for SSC & HSC exams
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10"
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-primary-foreground glow-primary"
                    : "glass-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        {/* Items Grid */}
        <div className="max-w-4xl mx-auto grid gap-3">
          {active.items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="glass-card-hover p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0 flex items-center justify-center">
                  <FolderOpen size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h4 className="font-medium text-foreground truncate">{item.title}</h4>
                    <span className={`inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tagColors[active.tag]}`}>
                      {active.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.pages} pages · PDF · {item.size}
                  </p>
                </div>
              </div>
              <button className="flex-shrink-0 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all glow-primary">
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
