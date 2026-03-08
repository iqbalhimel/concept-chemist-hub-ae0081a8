import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useMemo } from "react";
import { Bell, Calendar, Copy, Pin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";

interface Notice { id: string; title: string; date: string; description: string | null; sort_order?: number; is_pinned?: boolean; expires_at?: string | null; created_at: string; }

const HOMEPAGE_LIMIT = 5;

const NoticesSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Notice | null>(null);
  const { t, lang } = useLanguage();

  useEffect(() => {
    const fetchNotices = async () => {
      const [{ data }, { count }] = await Promise.all([
        supabase.from("notices").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(HOMEPAGE_LIMIT),
        supabase.from("notices").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);
      if (data && data.length > 0) setNotices(data as Notice[]);
      setTotalCount(count || 0);
    };
    fetchNotices();
  }, []);

  const sortedNotices = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const active = notices.filter(n => !n.expires_at || n.expires_at >= today);
    return [...active.filter(n => n.is_pinned), ...active.filter(n => !n.is_pinned)];
  }, [notices]);

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <section id="notices" className="section-padding">
        <div className="container mx-auto" ref={ref}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-center mb-4">{t.notices.title_1} <span className="gradient-text">{t.notices.title_highlight}</span></h2>
            <p className="text-center text-muted-foreground mb-12">{t.notices.subtitle}</p>
          </motion.div>
          <div className="max-w-3xl mx-auto space-y-4">
            {sortedNotices.map((notice, i) => (
              <motion.div key={notice.id} initial={{ opacity: 0, x: -20 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className={`glass-card-hover p-5 flex gap-4 items-start cursor-pointer transition-all hover:scale-[1.01] ${notice.is_pinned ? "ring-2 ring-primary/40" : ""}`}
                onClick={() => setSelected(notice)} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setSelected(notice); }}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  {notice.is_pinned ? <Pin size={20} className="text-primary fill-primary" /> : <Bell size={20} className="text-primary" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-foreground text-base mb-1">{notice.title}</h3>
                    {notice.is_pinned && <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">{t.notices.pinned}</span>}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{notice.description || t.notices.no_details}</p>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium"><Calendar size={12} />{formatDate(notice.date)}</div>
                </div>
              </motion.div>
            ))}
          </div>
          {totalCount > HOMEPAGE_LIMIT && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.6 }} className="text-center mt-10">
              <Link
                to={`/${lang}/notices`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all glow-primary"
              >
                {t.notices.see_all}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}
        </div>
      </section>
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 pr-8"><DialogTitle className="font-display text-xl">{selected?.title}</DialogTitle>
              {selected?.is_pinned && <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">{t.notices.pinned}</span>}
            </div>
            {selected && <DialogDescription className="flex items-center gap-1.5 text-primary font-medium"><Calendar size={14} />{formatDate(selected.date)}</DialogDescription>}
          </DialogHeader>
          <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{selected?.description || t.notices.no_additional}</div>
          <div className="flex justify-end pt-2"><Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.origin + "/#notices"); toast.success("Link copied"); }}><Copy size={14} className="mr-1.5" />{t.notices.copy_link}</Button></div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NoticesSection;
