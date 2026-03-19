import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SearchResultModule =
  | "blog"
  | "notices"
  | "study-materials"
  | "videos"
  | "gallery"
  | "testimonials"
  | "faq";

export interface SearchResult {
  id: string;
  title: string;
  module: SearchResultModule;
  moduleLabel: string;
  meta?: string;
}

const MODULE_LABELS: Record<SearchResultModule, string> = {
  blog: "Blog Posts",
  notices: "Notices",
  "study-materials": "Study Materials",
  videos: "Educational Videos",
  gallery: "Gallery",
  testimonials: "Testimonials",
  faq: "FAQ",
};

const LIMIT_PER_MODULE = 5;
const DEBOUNCE_MS = 300;

export function useAdminSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(0);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    const ticket = ++abortRef.current;
    setLoading(true);

    const pattern = `%${trimmed}%`;

    const [blog, notices, materials, videos, gallery, testimonials, faq] =
      await Promise.all([
        supabase
          .from("blog_posts")
          .select("id, title, category, created_at")
          .ilike("title", pattern)
          .is("trashed_at", null)
          .limit(LIMIT_PER_MODULE),
        supabase
          .from("notices")
          .select("id, title, date")
          .ilike("title", pattern)
          .is("trashed_at", null)
          .limit(LIMIT_PER_MODULE),
        supabase
          .from("study_materials")
          .select("id, title, category")
          .ilike("title", pattern)
          .is("trashed_at", null)
          .limit(LIMIT_PER_MODULE),
        supabase
          .from("educational_videos")
          .select("id, title, subject")
          .ilike("title", pattern)
          .limit(LIMIT_PER_MODULE),
        supabase
          .from("gallery")
          .select("id, label, image_url")
          .ilike("label", pattern)
          .is("trashed_at", null)
          .limit(LIMIT_PER_MODULE),
        supabase
          .from("testimonials")
          .select("id, student_name, student_info")
          .ilike("student_name", pattern)
          .is("trashed_at", null)
          .limit(LIMIT_PER_MODULE),
        supabase
          .from("faq")
          .select("id, question")
          .ilike("question", pattern)
          .limit(LIMIT_PER_MODULE),
      ]);

    // Stale check
    if (ticket !== abortRef.current) return;

    const merged: SearchResult[] = [];

    blog.data?.forEach((r) =>
      merged.push({
        id: r.id,
        title: r.title,
        module: "blog",
        moduleLabel: MODULE_LABELS.blog,
        meta: r.category,
      })
    );
    notices.data?.forEach((r) =>
      merged.push({
        id: r.id,
        title: r.title,
        module: "notices",
        moduleLabel: MODULE_LABELS.notices,
        meta: r.date,
      })
    );
    materials.data?.forEach((r) =>
      merged.push({
        id: r.id,
        title: r.title,
        module: "study-materials",
        moduleLabel: MODULE_LABELS["study-materials"],
        meta: r.category,
      })
    );
    videos.data?.forEach((r) =>
      merged.push({
        id: r.id,
        title: r.title,
        module: "videos",
        moduleLabel: MODULE_LABELS.videos,
        meta: r.subject,
      })
    );
    gallery.data?.forEach((r) =>
      merged.push({
        id: r.id,
        title: r.label || "Untitled image",
        module: "gallery",
        moduleLabel: MODULE_LABELS.gallery,
      })
    );
    testimonials.data?.forEach((r) =>
      merged.push({
        id: r.id,
        title: r.student_name,
        module: "testimonials",
        moduleLabel: MODULE_LABELS.testimonials,
        meta: r.student_info,
      })
    );
    faq.data?.forEach((r) =>
      merged.push({
        id: r.id,
        title: r.question,
        module: "faq",
        moduleLabel: MODULE_LABELS.faq,
      })
    );

    setResults(merged);
    setLoading(false);
  }, []);

  // Debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => search(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, search]);

  return { query, setQuery, results, loading };
}
