import { useCallback } from "react";

type VideoForm = {
  title: string;
  description: string;
  subject: string;
  class_level: string;
  thumbnail_url: string | null;
  video_source: string;
  video_url: string | null;
  duration: string;
  is_published: boolean;
  sort_order: number;
};

const extractYouTubeId = (url: string): string | null => {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
};

const extractDriveId = (url: string): string | null => {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

const parseDuration = (iso: string): string => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h = parseInt(m[1] || "0");
  const min = parseInt(m[2] || "0");
  const sec = parseInt(m[3] || "0");
  if (h > 0) return `${h}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${min}:${String(sec).padStart(2, "0")}`;
};

export const useVideoMetadataSync = (
  setForm: React.Dispatch<React.SetStateAction<VideoForm>>
) => {
  const syncFromUrl = useCallback(
    async (url: string, source: string) => {
      if (!url.trim()) return;

      if (source === "youtube") {
        const videoId = extractYouTubeId(url);
        if (!videoId) return;

        // Always set thumbnail immediately
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        setForm((p) => ({ ...p, thumbnail_url: thumbUrl }));

        // Try oEmbed for title
        try {
          const res = await fetch(
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.title) {
              setForm((p) => ({
                ...p,
                title: p.title || data.title,
              }));
            }
          }
        } catch {
          // Silently fail — user can enter manually
        }

        // Try to get duration via ytInitialPlayerResponse scraping won't work due to CORS
        // Duration remains manual for YouTube unless user has API key
      }

      if (source === "google_drive") {
        const fileId = extractDriveId(url);
        if (!fileId) return;

        // Google Drive thumbnail via export
        const thumbUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w480`;
        setForm((p) => ({ ...p, thumbnail_url: thumbUrl }));
      }
    },
    [setForm]
  );

  return { syncFromUrl };
};
