import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Where are the classes held?",
    a: "Classes are held at Zilla Smarani Girls' High School, Kishoreganj where Iqbal Sir serves as Assistant Teacher (Science). Private coaching batches are also conducted at a dedicated coaching center in Kishoreganj town.",
  },
  {
    q: "Do you offer online classes?",
    a: "Yes! Online classes are available via Zoom and Google Meet for students who cannot attend in person. Recorded lectures and digital notes are also shared with online students for revision.",
  },
  {
    q: "How can students join a batch?",
    a: "Students can join by contacting Iqbal Sir directly via WhatsApp at +8801733579100 or by calling +8801687476714. You can also use the contact form on this website to send an inquiry.",
  },
  {
    q: "Are study materials free?",
    a: "Yes, most study notes, PDF guides, and concept explanations are provided free of charge to all students. Additional premium materials and model test papers are available for enrolled batch students.",
  },
];

const FAQSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="section-padding">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
            Common Questions
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="glass-card px-6 border-glass-border rounded-xl overflow-hidden"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary transition-colors py-5 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
