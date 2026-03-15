import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  title: string;
  slug: string | null;
  category: string;
  matchReason: string;
  score: number;
}

interface Props {
  postId: string;
  postCategory: string;
  postTitle: string;
  postContent: string;
  onInsertLink: (html: string) => void;
}

const InternalLinkSuggestions = ({ postId, postCategory, postTitle, postContent, onInsertLink }: Props) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [postTagNames, setPostTagNames] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Get this post's tags
      const { data: postTagRows } = await supabase
        .from("post_tags")
        .select("tag_id")
        .eq("post_id", postId);

      const tagIds = postTagRows?.map(r => r.tag_id) || [];

      let tagNameMap: Record<string, string> = {};
      if (tagIds.length > 0) {
        const { data: tags } = await supabase
          .from("tags")
          .select("id, name")
          .in("id", tagIds);
        tags?.forEach(t => { tagNameMap[t.id] = t.name; });
        setPostTagNames(Object.values(tagNameMap));
      }

      // Get all other published posts
      const { data: allPosts } = await supabase
        .from("blog_posts")
        .select("id, title, slug, category, is_published")
        .neq("id", postId)
        .is("trashed_at", null);

      if (!allPosts || allPosts.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      // Get tags for all other posts
      let otherPostTags: Record<string, string[]> = {};
      if (tagIds.length > 0) {
        const { data: otherPTs } = await supabase
          .from("post_tags")
          .select("post_id, tag_id")
          .in("tag_id", tagIds)
          .neq("post_id", postId);

        otherPTs?.forEach(pt => {
          if (!otherPostTags[pt.post_id]) otherPostTags[pt.post_id] = [];
          otherPostTags[pt.post_id].push(tagNameMap[pt.tag_id] || pt.tag_id);
        });
      }

      // Score each post
      const scored: Suggestion[] = allPosts.map(p => {
        let score = 0;
        const reasons: string[] = [];

        // Same category
        if (p.category === postCategory) {
          score += 3;
          reasons.push("Same category");
        }

        // Shared tags
        const sharedTags = otherPostTags[p.id] || [];
        if (sharedTags.length > 0) {
          score += sharedTags.length * 2;
          reasons.push(`${sharedTags.length} shared tag${sharedTags.length > 1 ? "s" : ""}`);
        }

        // Title word overlap (lightweight)
        const titleWords = postTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const otherWords = p.title.toLowerCase().split(/\s+/);
        const overlap = titleWords.filter(w => otherWords.includes(w)).length;
        if (overlap > 0) {
          score += overlap;
          reasons.push("Title match");
        }

        return {
          id: p.id,
          title: p.title,
          slug: p.slug,
          category: p.category,
          matchReason: reasons.join(", ") || "Other post",
          score,
        };
      });

      // Filter only relevant, sort by score
      const relevant = scored
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      setSuggestions(relevant);
      setLoading(false);
    };

    if (postId) load();
  }, [postId, postCategory, postTitle]);

  // Check which suggested posts are already linked in content
  const linkedIds = useMemo(() => {
    const ids = new Set<string>();
    suggestions.forEach(s => {
      const slug = s.slug || s.id;
      if (postContent.includes(`/blog/${slug}`)) {
        ids.add(s.id);
      }
    });
    return ids;
  }, [postContent, suggestions]);

  const handleInsert = (s: Suggestion) => {
    const slug = s.slug || s.id;
    const linkHtml = `<a href="/blog/${slug}">${s.title}</a>`;
    onInsertLink(linkHtml);
    toast.success("Link HTML copied — paste it into your content");
  };

  const copyLink = (s: Suggestion) => {
    const slug = s.slug || s.id;
    navigator.clipboard.writeText(`/blog/${slug}`);
    toast.success("Link path copied");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" /> Analyzing for link suggestions...
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 size={14} className="text-primary" />
          Suggested Internal Links
          <Badge variant="secondary" className="text-[10px] ml-auto">{suggestions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-1.5">
        {suggestions.map(s => {
          const alreadyLinked = linkedIds.has(s.id);
          return (
            <div
              key={s.id}
              className={`flex items-center gap-2 p-2 rounded-md border text-sm transition-colors ${
                alreadyLinked
                  ? "border-primary/20 bg-primary/5 opacity-60"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-medium truncate text-xs">{s.title}</p>
                <p className="text-[10px] text-muted-foreground">{s.matchReason}</p>
              </div>
              {alreadyLinked ? (
                <span className="text-[10px] text-primary font-medium shrink-0">Linked ✓</span>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[10px]"
                    onClick={() => handleInsert(s)}
                    title="Copy link HTML"
                  >
                    <Copy size={10} className="mr-0.5" /> Insert
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyLink(s)}
                    title="Copy URL path"
                  >
                    <ExternalLink size={10} />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default InternalLinkSuggestions;
