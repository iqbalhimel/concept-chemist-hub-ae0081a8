import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Loader2, LinkIcon } from "lucide-react";

interface OrphanPost {
  id: string;
  title: string;
  slug: string | null;
  is_published: boolean;
}

/**
 * Scans all blog posts to find "orphan" posts — posts that
 * no other post links to internally.
 */
const OrphanContentWidget = () => {
  const [orphans, setOrphans] = useState<OrphanPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyze = async () => {
      const { data: posts } = await supabase
        .from("blog_posts")
        .select("id, title, slug, content, is_published")
        .is("trashed_at", null);

      if (!posts || posts.length === 0) {
        setLoading(false);
        return;
      }

      // Collect all internal links from all post content
      const linkedSlugs = new Set<string>();
      const linkedIds = new Set<string>();

      posts.forEach(p => {
        if (!p.content) return;
        // Match /blog/slug patterns
        const slugMatches = p.content.match(/\/blog\/([a-z0-9-]+)/gi);
        slugMatches?.forEach(m => {
          const slug = m.replace(/^\/blog\//i, "");
          linkedSlugs.add(slug);
        });
      });

      // Map slugs/ids to actual posts
      posts.forEach(p => {
        const slug = p.slug || p.id;
        if (linkedSlugs.has(slug) || linkedSlugs.has(p.id)) {
          linkedIds.add(p.id);
        }
      });

      // Orphans = posts not linked by any other post
      const orphanPosts = posts
        .filter(p => !linkedIds.has(p.id))
        .map(p => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          is_published: p.is_published,
        }));

      setOrphans(orphanPosts);
      setLoading(false);
    };

    analyze();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <LinkIcon size={14} className="text-amber-500" />
          Orphan Content
          {!loading && (
            <span className="text-[10px] font-normal text-muted-foreground ml-auto">
              {orphans.length} post{orphans.length !== 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 size={14} className="animate-spin" /> Scanning internal links...
          </div>
        ) : orphans.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">All posts have at least one internal link pointing to them. 🎉</p>
        ) : (
          <>
            <p className="text-[10px] text-muted-foreground mb-2">
              These posts have no internal links from other posts. Consider linking to them for better SEO.
            </p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {orphans.slice(0, 15).map(p => (
                <div key={p.id} className="flex items-center gap-2 text-xs py-1 border-b border-border last:border-0">
                  <AlertTriangle size={10} className="text-amber-500 shrink-0" />
                  <span className="text-foreground truncate flex-1">{p.title}</span>
                  {!p.is_published && (
                    <span className="text-[9px] text-muted-foreground shrink-0">Draft</span>
                  )}
                </div>
              ))}
              {orphans.length > 15 && (
                <p className="text-[10px] text-muted-foreground pt-1">
                  +{orphans.length - 15} more
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrphanContentWidget;
