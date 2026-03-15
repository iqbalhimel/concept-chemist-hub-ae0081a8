import { useState, useEffect } from "react";
import { Bell, Calendar, Pin, ArrowLeft, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { setSeo, generateBreadcrumbSchema } from "@/lib/seo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Notice {
  id: string;
  title: string;
  date: string;
  description: string | null;
  is_pinned?: boolean;
  expires_at?: string | null;
  created_at: string;
}

const PAGE_SIZE = 10;

const NoticesPage = () => {
  const { lang, t } = useLanguage();
  const { get } = useSiteSettings();
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Notice | null>(null);

  useEffect(() => {
    const autoCanonical = "https://iqbalsir.bd/notices";
    const defaultOgImage = get("seo", "og_image", "");
    const cleanup = setSeo({
      title: "Notices – Iqbal Sir",
      description: "Latest notices and announcements from Iqbal Sir's coaching.",
      url: autoCanonical,
      canonicalUrl: autoCanonical,
      image: defaultOgImage || undefined,
      jsonLd: generateBreadcrumbSchema([
        { name: "Home", url: "https://iqbalsir.bd" },
        { name: "Notices", url: autoCanonical },
      ]),
    });
    return cleanup;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const now = new Date().toISOString();
      const [{ data }, { count }] = await Promise.all([
        supabase.from("notices").select("*").eq("is_active", true).is("trashed_at", null)
          .or(`publish_at.is.null,publish_at.lte.${now}`)
          .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString().split("T")[0]}`)
          .order("created_at", { ascending: false }).range(from, to),
        supabase.from("notices").select("*", { count: "exact", head: true }).eq("is_active", true).is("trashed_at", null)
          .or(`publish_at.is.null,publish_at.lte.${now}`)
          .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString().split("T")[0]}`),
      ]);
      setItems((data as Notice[]) || []);
      setTotal(count || 0);
      setLoading(false);
    };
    fetchData();
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <>
      <main id="main-content" className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to={`/${lang}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft size={16} />
            {t.not_found.back}
          </Link>

          <div className="text-center mb-12">
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
              {t.notices.title_1} <span className="gradient-text">{t.notices.title_highlight}</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.notices.subtitle}</p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-12">Loading...</div>
          ) : (
            <>
              <div className="max-w-3xl mx-auto space-y-4">
                {items.map((notice) => (
                  <div
                    key={notice.id}
                    className={`glass-card-hover p-5 flex gap-4 items-start cursor-pointer transition-all hover:scale-[1.01] ${notice.is_pinned ? "ring-2 ring-primary/40" : ""}`}
                    onClick={() => setSelected(notice)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setSelected(notice); }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      {notice.is_pinned ? <Pin size={20} className="text-primary fill-primary" /> : <Bell size={20} className="text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-foreground text-base mb-1">{notice.title}</h3>
                        {notice.is_pinned && <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">{t.notices.pinned}</span>}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">{notice.description || t.notices.no_details}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-primary font-medium">
                        <Calendar size={12} />{formatDate(notice.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-10">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                        page === i + 1
                          ? "bg-primary text-primary-foreground"
                          : "glass-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 pr-8">
              <DialogTitle className="font-display text-xl">{selected?.title}</DialogTitle>
              {selected?.is_pinned && <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">{t.notices.pinned}</span>}
            </div>
            {selected && <DialogDescription className="flex items-center gap-1.5 text-primary font-medium"><Calendar size={14} />{formatDate(selected.date)}</DialogDescription>}
          </DialogHeader>
          <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{selected?.description || t.notices.no_additional}</div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); }}>
              <Copy size={14} className="mr-1.5" />{t.notices.copy_link}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NoticesPage;
