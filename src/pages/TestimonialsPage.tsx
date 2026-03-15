import { useState, useEffect } from "react";
import { Quote, Star, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface Testimonial {
  id: string;
  student_name: string;
  student_info: string;
  testimonial_text_en: string;
  testimonial_text_bn: string;
  rating: number;
  created_at: string;
}

const PAGE_SIZE = 10;

const TestimonialsPage = () => {
  const { lang, t } = useLanguage();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const [{ data }, { count }] = await Promise.all([
        supabase.from("testimonials").select("*").eq("is_active", true).is("trashed_at" as any, null).order("created_at", { ascending: false }).range(from, to),
        supabase.from("testimonials").select("*", { count: "exact", head: true }).eq("is_active", true).is("trashed_at" as any, null),
      ]);
      setItems((data as Testimonial[]) || []);
      setTotal(count || 0);
      setLoading(false);
    };
    fetchData();
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main id="main-content" className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <Link to={`/${lang}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
            <ArrowLeft size={16} />
            {t.blog_post?.back_blog ? t.not_found.back : "Return to Home"}
          </Link>

          <div className="text-center mb-12">
            <span className="badge-soft text-primary border border-primary/20 mb-5">{t.testimonials.badge}</span>
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
              {t.testimonials.title_1} <span className="gradient-text">{t.testimonials.title_highlight}</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.testimonials.subtitle}</p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground py-12">Loading...</div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
                {items.map((item) => {
                  const text = lang === "bn" && item.testimonial_text_bn
                    ? item.testimonial_text_bn
                    : item.testimonial_text_en || item.testimonial_text_bn;
                  return (
                    <div key={item.id} className="glass-card-hover p-6 flex flex-col gap-4">
                      <Quote size={24} className="text-primary/40" />
                      <p className="text-muted-foreground text-sm leading-relaxed flex-1">"{text}"</p>
                      <div className="flex items-center gap-1 text-primary">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <Star key={s} size={14} className={s < item.rating ? "fill-current" : "opacity-20"} />
                        ))}
                      </div>
                      <div className="border-t border-border pt-3">
                        <p className="font-medium text-foreground text-sm">{item.student_name}</p>
                        <p className="text-xs text-muted-foreground">{item.student_info}</p>
                      </div>
                    </div>
                  );
                })}
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
  );
};

export default TestimonialsPage;
