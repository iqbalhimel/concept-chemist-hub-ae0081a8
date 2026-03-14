import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Clock, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import OptimizedImage from "@/components/OptimizedImage";

type Video = {
  id: string;
  title: string;
  subject: string;
  class_level: string;
  thumbnail_url: string | null;
  video_source: string;
  video_url: string | null;
  duration: string;
  description: string;
  created_at: string;
};

const getEmbedUrl = (video: Video) => {
  if (!video.video_url) return null;
  if (video.video_source === "youtube") {
    const match = video.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : null;
  }
  if (video.video_source === "google_drive") {
    const match = video.video_url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? `https://drive.google.com/file/d/${match[1]}/preview` : null;
  }
  return video.video_url; // direct mp4/webm
};

const VideoSection = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const { lang } = useLanguage();

  useEffect(() => {
    supabase
      .from("educational_videos")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setVideos(data as Video[]);
        setLoaded(true);
      });
  }, []);

  if (!loaded || videos.length === 0) return null;

  return (
    <>
      <section id="videos" className="section-padding">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
              Educational Videos
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Watch &amp; <span className="gradient-text">Learn</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Explore video lessons on key topics
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto">
            {videos.map((video, i) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl overflow-hidden bg-card border border-border/50 group cursor-pointer"
                onClick={() => setActiveVideo(video)}
              >
                {/* Thumbnail with play overlay */}
                <div className="relative aspect-video bg-muted">
                  {video.thumbnail_url ? (
                    <OptimizedImage
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <Play size={40} className="text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-background/20 group-hover:bg-background/40 transition-colors">
                    <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={24} className="text-primary-foreground ml-1" />
                    </div>
                  </div>
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-background/80 text-xs font-medium text-foreground backdrop-blur-sm flex items-center gap-1">
                      <Clock size={12} /> {video.duration}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{video.title}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {video.subject && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Tag size={10} /> {video.subject}
                      </span>
                    )}
                    {video.class_level && (
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {video.class_level}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to={`/${lang}/videos`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
            >
              See All Videos
            </Link>
          </div>
        </div>
      </section>

      {/* Video Player Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setActiveVideo(null)}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setActiveVideo(null); }}
              className="fixed top-4 right-4 z-[120] w-11 h-11 rounded-full bg-foreground/90 text-background flex items-center justify-center hover:bg-foreground transition-colors shadow-lg"
              aria-label="Close video"
            >
              <X size={22} />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl"
            >
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                {activeVideo.video_source === "upload" ? (
                  <video
                    src={activeVideo.video_url || ""}
                    controls
                    autoPlay
                    className="w-full h-full"
                  />
                ) : (
                  <iframe
                    src={getEmbedUrl(activeVideo) || ""}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                    title={activeVideo.title}
                  />
                )}
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-foreground">{activeVideo.title}</h3>
                {activeVideo.description && (
                  <p className="text-sm text-muted-foreground mt-1">{activeVideo.description}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VideoSection;
