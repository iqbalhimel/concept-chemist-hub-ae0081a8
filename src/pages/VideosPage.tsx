import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Clock, Tag, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/OptimizedImage";
import { setSeo } from "@/lib/seo";
import RelatedBlogPosts from "@/components/RelatedBlogPosts";
import { trackContentView } from "@/lib/trackContentView";

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
  return video.video_url;
};

const VideosPage = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");

  useEffect(() => {
    const now = new Date().toISOString();
    supabase
      .from("educational_videos")
      .select("*")
      .eq("is_published", true)
      .or(`publish_at.is.null,publish_at.lte.${now}`)
      .or(`expire_at.is.null,expire_at.gte.${now}`)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setVideos(data as Video[]);
        setLoading(false);
      });
  }, []);

  const subjects = [...new Set(videos.map(v => v.subject).filter(Boolean))];

  const filtered = videos.filter(v => {
    const matchSearch = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !subjectFilter || v.subject === subjectFilter;
    return matchSearch && matchSubject;
  });

  return (
    <>
      {/* SEO handled globally by SeoHead */}
      <main className="min-h-screen section-padding">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-4">
              Educational <span className="gradient-text">Videos</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">Browse all video lessons</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search videos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {subjects.length > 0 && (
              <select
                value={subjectFilter}
                onChange={e => setSubjectFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-20">No videos found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filtered.map((video, i) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 6) * 0.05 }}
                  className="rounded-xl overflow-hidden bg-card border border-border/50 group cursor-pointer"
                  onClick={() => { trackContentView("video", video.id); setActiveVideo(video); }}
                >
                  <div className="relative aspect-video bg-muted">
                    {video.thumbnail_url ? (
                      <OptimizedImage src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted"><Play size={40} className="text-muted-foreground/30" /></div>
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
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{video.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {video.subject && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          <Tag size={10} /> {video.subject}
                        </span>
                      )}
                      {video.class_level && (
                        <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">{video.class_level}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Related Blog Posts */}
          {subjectFilter && (
            <RelatedBlogPosts matchCategory={subjectFilter} title="Related Blog Posts" />
          )}
        </div>
      </main>

      {/* Player Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-background/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setActiveVideo(null)}
          >
            <button type="button" onClick={e => { e.stopPropagation(); setActiveVideo(null); }}
              className="fixed top-4 right-4 z-[120] w-11 h-11 rounded-full bg-foreground/90 text-background flex items-center justify-center hover:bg-foreground transition-colors shadow-lg" aria-label="Close video">
              <X size={22} />
            </button>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="w-full max-w-4xl">
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                {activeVideo.video_source === "upload" ? (
                  <video src={activeVideo.video_url || ""} controls autoPlay className="w-full h-full" />
                ) : (
                  <iframe src={getEmbedUrl(activeVideo) || ""} className="w-full h-full" allow="autoplay; fullscreen; encrypted-media" allowFullScreen title={activeVideo.title} />
                )}
              </div>
              <div className="mt-3">
                <h3 className="text-lg font-semibold text-foreground">{activeVideo.title}</h3>
                {activeVideo.description && <p className="text-sm text-muted-foreground mt-1">{activeVideo.description}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VideosPage;
