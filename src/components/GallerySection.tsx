import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type GalleryItem = {
  id: string;
  image_url: string;
  alt: string | null;
  label: string | null;
  span: string | null;
  sort_order: number;
};

const fallbackPhotos: GalleryItem[] = [
  { id: "f1", image_url: "", alt: "Interactive teaching session", label: "Interactive Learning", span: "col-span-2", sort_order: 0 },
  { id: "f2", image_url: "", alt: "Science lab experiment", label: "Lab Experiments", span: "col-span-1", sort_order: 1 },
  { id: "f3", image_url: "", alt: "Students in classroom", label: "Classroom Session", span: "col-span-1", sort_order: 2 },
];

const GallerySection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        setPhotos(data);
      }
      setLoaded(true);
    };
    fetch();
  }, []);

  // Don't render section if loaded and no photos and no fallbacks to show
  const displayPhotos = photos.length > 0 ? photos : [];
  
  if (loaded && displayPhotos.length === 0) {
    return (
      <section id="gallery" className="section-padding">
        <div className="container mx-auto" ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              Inside the Classroom
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Classroom <span className="gradient-text">Gallery</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Photos coming soon! Check back later for a glimpse into our interactive learning environment.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto auto-rows-[200px] md:auto-rows-[240px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`${i === 1 ? "col-span-2" : ""} relative rounded-xl overflow-hidden bg-muted/30 border border-border/50 flex items-center justify-center`}>
                <ImageIcon size={40} className="text-muted-foreground/30" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!loaded) return null;

  const getSpanClass = (span: string | null, index: number) => {
    if (span && span !== "normal") return span;
    const patterns = ["col-span-2", "col-span-1", "col-span-1 row-span-2", "col-span-1"];
    return patterns[index % patterns.length];
  };

  return (
    <>
      <section id="gallery" className="section-padding">
        <div className="container mx-auto" ref={ref}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              Inside the Classroom
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Classroom <span className="gradient-text">Gallery</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A glimpse into our interactive and engaging learning environment
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto">
            {displayPhotos.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                className="relative rounded-xl overflow-hidden cursor-pointer group"
                style={{ minHeight: "250px" }}
                onClick={() => setLightbox(photo.image_url)}
              >
                <img
                  src={photo.image_url}
                  alt={photo.alt || photo.label || "Gallery image"}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/60 backdrop-blur-sm">
                  <span className="text-sm font-medium text-foreground">{photo.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {lightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full glass-card flex items-center justify-center text-foreground hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
          <img
            src={lightbox}
            alt="Gallery preview"
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
          />
        </motion.div>
      )}
    </>
  );
};

export default GallerySection;
