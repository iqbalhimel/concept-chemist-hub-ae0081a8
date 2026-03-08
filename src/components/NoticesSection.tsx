import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Bell, Calendar, Copy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Notice {
  id: string;
  title: string;
  date: string;
  description: string | null;
  sort_order?: number;
  created_at?: string;
}

const fallbackNotices: Notice[] = [
  {
    id: "fallback-1",
    title: "New SSC Physics Batch Starting Soon",
    date: "2026-03-10",
    description:
      "Enrollment is now open for the upcoming SSC Physics batch. Limited seats available.",
  },
  {
    id: "fallback-2",
    title: "HSC Chemistry Revision Classes",
    date: "2026-03-15",
    description:
      "Special revision sessions for HSC Chemistry students before the board exam.",
  },
  {
    id: "fallback-3",
    title: "Class 9–10 Math Batch – Evening Schedule",
    date: "2026-03-05",
    description:
      "New evening batch for Classes 9–10 Mathematics starting this week.",
  },
];

const NoticesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [notices, setNotices] = useState<Notice[]>(fallbackNotices);
  const [selected, setSelected] = useState<Notice | null>(null);

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

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + "/#notices");
    toast.success("Link copied to clipboard");
  };

  return (
    <>
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
                className="glass-card-hover p-5 flex gap-4 items-start cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
                onClick={() => setSelected(notice)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelected(notice);
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bell size={20} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-foreground text-base mb-1">
                    {notice.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                    {notice.description || "No details available."}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium">
                    <Calendar size={12} />
                    {formatDate(notice.date)}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Notice Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl pr-8">
              {selected?.title}
            </DialogTitle>
            {selected && (
              <DialogDescription className="flex items-center gap-1.5 text-primary font-medium">
                <Calendar size={14} />
                {formatDate(selected.date)}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {selected?.description || "No additional details provided for this notice."}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy size={14} className="mr-1.5" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NoticesSection;
