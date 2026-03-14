import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export const useVideoMetadataSync = (
  setForm: React.Dispatch<React.SetStateAction<VideoForm>>
) => {
  const syncFromUrl = useCallback(
    async (url: string, source: string) => {
      if (!url.trim()) return;

      if (source === "youtube") {
        const videoId = extractYouTubeId(url);
        if (!videoId) return;

        // Set thumbnail immediately
        const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        setForm((p) => ({ ...p, thumbnail_url: thumbUrl }));

        // Fetch title via oEmbed
        try {
          const res = await fetch(
            `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.title) {
              setForm((p) => ({ ...p, title: p.title || data.title }));
            }
          }
        } catch {
          // Silently fail
        }

        // Fetch duration via edge function
        try {
          const { data, error } = await supabase.functions.invoke("youtube-duration", {
            body: { videoId },
          });
          if (!error && data?.duration) {
            setForm((p) => ({ ...p, duration: data.duration }));
          }
        } catch {
          // Duration remains editable manually
        }
      }

      if (source === "google_drive") {
        const fileId = extractDriveId(url);
        if (!fileId) return;
        const thumbUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w480`;
        setForm((p) => ({ ...p, thumbnail_url: thumbUrl }));
      }
    },
    [setForm]
  );

  return { syncFromUrl };
};
