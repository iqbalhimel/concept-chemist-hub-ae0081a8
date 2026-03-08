import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Bell, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fallbackNotices = [
  {
    id: "fallback-1",
    title: "New SSC Physics Batch Starting Soon",
    date: "2026-03-10",
    description: "Enrollment is now open for the upcoming SSC Physics batch. Limited seats available.",
  },
  {
    id: "fallback-2",
    title: "HSC Chemistry Revision Classes",
    date: "2026-03-15",
    description: "Special revision sessions for HSC Chemistry students before the board exam.",
  },
  {
    id: "fallback-3",
    title: "Class 9–10 Math Batch – Evening Schedule",
    date: "2026-03-05",
    description: "New evening batch for Classes 9–10 Mathematics starting this week.",
  },
];

const NoticesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [notices, setNotices] = useState(fallbackNotices);

  useEffect(() => {
    const fetchNotices = async () => {
      const { data } = await supabase
        .from("notices")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (data && data.length > 0) {
        setNotices(data);
      }
    };
    fetchNotices();
  }, []);

  return (
    <section id="notices" className="section-padding">
      <div className="container mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">
            Latest <span className="gradient-text">Notices</span>
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            New batch announcements & important updates
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {notices.map((notice, i) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
              className="glass-card-hover p-5 flex gap-4 items-start"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bell size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-foreground text-base mb-1">{notice.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{notice.description}</p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium">
                  <Calendar size={12} />
                  {new Date(notice.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NoticesSection;
