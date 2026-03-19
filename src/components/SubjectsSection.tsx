import { motion } from "framer-motion";
import { useState, useEffect, memo } from "react";
import { Atom, FlaskConical, Leaf, Calculator, Binary, BookMarked, Monitor, BookOpen, Lightbulb } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ElementType> = { Atom, FlaskConical, Leaf, Calculator, Binary, BookMarked, Monitor, BookOpen, Lightbulb };

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const vp = { once: true, amount: 0.15 as const };

const SubjectsSection = () => {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("subjects").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setItems(data || []));
  }, []);

  if (items.length === 0) return null;

  const grouped = items.reduce<Record<string, any[]>>((acc, item) => {
    const cat = (item.category || (t.subjects?.category_other ?? "Other")).trim();
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // UI translations for common category values coming from DB.
  // (We do not modify DB content — only map display labels.)
  const categoryLabels: Record<string, string> = {
    SSC: t.subjects?.category_ssc ?? "SSC Level",
    HSC: t.subjects?.category_hsc ?? "HSC Level",
    "Class 6-10": t.subjects?.category_class_6_10 ?? "Class 6–10",
  };

  // Map common English subject names -> Bangla in BN mode (without touching DB).
  const subjectNameMapBn: Record<string, string> = {
    Physics: t.subjects?.physics ?? "পদার্থবিজ্ঞান",
    Chemistry: t.subjects?.chemistry ?? "রসায়ন",
    Biology: t.subjects?.biology ?? "জীববিজ্ঞান",
    Mathematics: t.subjects?.mathematics ?? "গণিত",
  };

  const mapSubjectNameForLang = (raw: string) => {
    const name = (raw || "").trim();
    if (!name) return t.subjects?.untitled ?? "Untitled";
    if (lang !== "bn") return name;
    return subjectNameMapBn[name] ?? name;
  };

  return (
    <section id="subjects" className="section-padding">
      <div className="container mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.6 }}>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            {t.subjects?.title_1 ?? ""} <span className="gradient-text">{t.subjects?.title_highlight ?? ""}</span>
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">{t.subjects?.subtitle ?? ""}</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {Object.entries(grouped).map(([cat, subs], gi) => (
            <motion.div key={cat} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ duration: 0.5, delay: 0.1 + gi * 0.1 }} className="glass-card-hover p-8">
              <h3 className="font-display text-lg font-bold text-primary mb-6">{categoryLabels[cat] || cat}</h3>
              <div className="space-y-4">
                {subs.map((sub: any) => {
                  const Icon = iconMap[sub?.icon ?? ""] || BookOpen;
                  const fallbackUntitled = t.subjects?.untitled ?? "Untitled";
                  const fromDb = lang === "bn"
                    ? (sub?.subject_name_bn || sub?.subject_name_en || fallbackUntitled)
                    : (sub?.subject_name_en || sub?.subject_name_bn || fallbackUntitled);
                  const name = mapSubjectNameForLang(fromDb);
                  return (
                    <div key={sub.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon size={20} className="text-primary" /></div>
                      <span className="text-foreground font-medium">{name}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default memo(SubjectsSection);
