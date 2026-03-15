import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UsageRef {
  source: string;
  title: string;
  id: string;
}

export interface UsageMap {
  [mediaUrl: string]: UsageRef[];
}

/**
 * Scans blog_posts, gallery, educational_videos, and site_settings
 * to find where each media URL is referenced.
 */
export function useMediaUsage() {
  const [usageMap, setUsageMap] = useState<UsageMap>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const map: UsageMap = {};

    const addRef = (url: string, ref: UsageRef) => {
      if (!url) return;
      if (!map[url]) map[url] = [];
      // Deduplicate
      if (!map[url].some(r => r.id === ref.id && r.source === ref.source)) {
        map[url].push(ref);
      }
    };

    // Blog posts — featured_image and content body
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("id, title, featured_image, content");
    posts?.forEach(p => {
      if (p.featured_image) {
        addRef(p.featured_image, { source: "Blog Post", title: p.title, id: p.id });
      }
      // Scan content for image URLs from our storage
      if (p.content) {
        const urlRegex = /https:\/\/[^\s"'<>)]+\/media\/[^\s"'<>)]+/g;
        const matches = p.content.match(urlRegex);
        matches?.forEach(url => {
          addRef(url, { source: "Blog Post (content)", title: p.title, id: p.id });
        });
      }
    });

    // Gallery
    const { data: gallery } = await supabase
      .from("gallery")
      .select("id, image_url, label");
    gallery?.forEach(g => {
      if (g.image_url) {
        addRef(g.image_url, { source: "Gallery", title: g.label || "Untitled", id: g.id });
      }
    });

    // Educational videos — thumbnail
    const { data: videos } = await supabase
      .from("educational_videos")
      .select("id, title, thumbnail_url");
    videos?.forEach(v => {
      if (v.thumbnail_url) {
        addRef(v.thumbnail_url, { source: "Video", title: v.title, id: v.id });
      }
    });

    // Site settings — scan JSON values for media URLs
    const { data: settings } = await supabase
      .from("site_settings")
      .select("key, value");
    settings?.forEach(s => {
      const str = JSON.stringify(s.value);
      const urlRegex = /https:\/\/[^\s"'<>)]+\/media\/[^\s"'<>)]+/g;
      const matches = str.match(urlRegex);
      matches?.forEach(url => {
        // Clean trailing quotes/brackets
        const cleaned = url.replace(/[",}\]]+$/, "");
        addRef(cleaned, { source: "Site Settings", title: s.key, id: s.key });
      });
    });

    setUsageMap(map);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { usageMap, usageLoading: loading, refreshUsage: refresh };
}
