import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  question_bn: string;
  answer_bn: string;
  sort_order: number;
}

const FAQSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useLanguage();

  useEffect(() => {
    const fetchFaqs = async () => {
      const { data } = await supabase
        .from("faq")
        .select("id, question, answer, question_bn, answer_bn, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      setFaqs(data || []);
      setLoading(false);
    };
    fetchFaqs();
  }, []);

  return (
    <section id="faq" className="section-padding">
      <div className="container mx-auto" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">{t.faq.badge}</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t.faq.title_1} <span className="gradient-text">{t.faq.title_highlight}</span></h2>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 }} className="max-w-3xl mx-auto">
          {loading ? <p className="text-center text-muted-foreground">{t.faq.loading}</p>
          : faqs.length === 0 ? <p className="text-center text-muted-foreground">{t.faq.empty}</p>
          : <Accordion type="single" collapsible className="space-y-3">
              {faqs.map(faq => {
                const question = lang === "bn" && faq.question_bn ? faq.question_bn : faq.question;
                const answer = lang === "bn" && faq.answer_bn ? faq.answer_bn : faq.answer;
                return (
                  <AccordionItem key={faq.id} value={faq.id} className="glass-card px-6 border-glass-border rounded-xl overflow-hidden">
                    <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary transition-colors py-5 hover:no-underline">{question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-5">{answer}</AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>}
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
