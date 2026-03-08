import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { X, ImageIcon } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

type GalleryItem = { id: string; image_url: string; alt: string | null; label: string | null; span: string | null; sort_order: number; };

const GallerySection = () => {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await supabase.from("gallery").select("*").order("sort_order", { ascending: true });
      if (data && data.length > 0) setPhotos(data);
      setLoaded(true);
    };
    fetchGallery();
  }, []);

  const displayPhotos = photos.filter(p => p.image_url && p.image_url.trim() !== "");

  const header = (subtitle: string) => (
    <div className="text-center mb-12">
      <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">{t.gallery.badge}</span>
      <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">{t.gallery.title_1} <span className="gradient-text">{t.gallery.title_highlight}</span></h2>
      <p className="text-muted-foreground max-w-xl mx-auto">{subtitle}</p>
    </div>
  );

  if (loaded && displayPhotos.length === 0) return (
    <section id="gallery" className="section-padding"><div className="container mx-auto">{header(t.gallery.empty)}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto auto-rows-[200px] md:auto-rows-[240px]">
        {[1,2,3].map(i => <div key={i} className={`${i===1?"col-span-2":""} relative rounded-xl overflow-hidden bg-muted/30 border border-border/50 flex items-center justify-center`}><ImageIcon size={40} className="text-muted-foreground/30" /></div>)}
      </div></div></section>
  );

  if (!loaded) return null;

  return (
    <><section id="gallery" className="section-padding"><div className="container mx-auto">{header(t.gallery.subtitle)}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto auto-rows-[220px] md:auto-rows-[260px]">
        {displayPhotos.map(photo => {
          const spanClass = photo.span === "wide" ? "col-span-2" : photo.span === "tall" ? "row-span-2" : photo.span === "large" ? "col-span-2 row-span-2" : "";
          return (
            <div key={photo.id} className={`relative rounded-xl overflow-hidden cursor-pointer group ${spanClass}`} onClick={() => setLightbox(photo.image_url)}>
              <OptimizedImage
                src={photo.image_url}
                alt={photo.alt || photo.label || "Gallery image"}
                widths={[400, 800, 1200]}
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/60 backdrop-blur-sm">
                <span className="text-sm font-medium text-foreground">{photo.label}</span>
              </div>
            </div>
          );
        })}
      </div></div></section>
    {lightbox && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={()=>setLightbox(null)}>
      <button onClick={()=>setLightbox(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full glass-card flex items-center justify-center text-foreground hover:text-primary transition-colors"><X size={20}/></button>
      <img src={lightbox} alt="Gallery preview" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
    </motion.div>}</>
  );
};

export default GallerySection;
