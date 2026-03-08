import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { X } from "lucide-react";
import galleryProjector from "@/assets/gallery-projector.jpg";
import galleryLab from "@/assets/gallery-lab.jpg";
import galleryGroup from "@/assets/gallery-group.jpg";
import galleryDigital from "@/assets/gallery-digital.jpg";


const photos = [
  { src: galleryProjector, alt: "Classroom teaching session", label: "Teaching Session", span: "col-span-2" },
  { src: galleryLab, alt: "Students in science lab", label: "Lab Activity", span: "col-span-1" },
  { src: galleryGroup, alt: "Student celebration with teacher", label: "Student Celebration", span: "col-span-1 row-span-2" },
  { src: galleryDigital, alt: "Class party with students", label: "Class Party", span: "col-span-1" },
];

const GallerySection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [lightbox, setLightbox] = useState<string | null>(null);

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

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-5xl mx-auto auto-rows-[200px] md:auto-rows-[240px]">
            {photos.map((photo, i) => (
              <motion.div
                key={photo.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                className={`${photo.span} relative rounded-xl overflow-hidden cursor-pointer group`}
                onClick={() => setLightbox(photo.src)}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-sm font-medium text-foreground">{photo.label}</span>
                </div>
                <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/40 rounded-xl transition-colors duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
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
