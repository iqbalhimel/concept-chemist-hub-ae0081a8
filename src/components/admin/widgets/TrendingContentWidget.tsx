import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Eye } from "lucide-react";

interface TrendingItem {
  content_id: string;
  view_count: number;
  title: string;
  type: string;
}

const typeBadge = (type: string) => {
  const colors: Record<string, string> = {
    Blog: "bg-blue-500/15 text-blue-400",
    Material: "bg-emerald-500/15 text-emerald-400",
    Video: "bg-purple-500/15 text-purple-400",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colors[type] || "bg-muted text-muted-foreground"}`}>
      {type}
    </span>
  );
};

const TrendingContentWidget = () => {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: views } = await (supabase as any)
        .from("content_views")
        .select("content_type, content_id, view_count")
        .order("view_count", { ascending: false })
        .limit(30);

      if (!views || views.length === 0) {
        setLoading(false);
        return;
      }

      const blogIds = views.filter((v: any) => v.content_type === "blog_post").slice(0, 3).map((v: any) => v.content_id);
      const matIds = views.filter((v: any) => v.content_type === "study_material").slice(0, 3).map((v: any) => v.content_id);
      const vidIds = views.filter((v: any) => v.content_type === "video").slice(0, 3).map((v: any) => v.content_id);

      const [blogRes, matRes, vidRes] = await Promise.all([
        blogIds.length > 0 ? supabase.from("blog_posts").select("id, title").in("id", blogIds) : Promise.resolve({ data: [] }),
        matIds.length > 0 ? (supabase as any).from("study_materials").select("id, title").in("id", matIds) : Promise.resolve({ data: [] }),
        vidIds.length > 0 ? supabase.from("educational_videos").select("id, title").in("id", vidIds) : Promise.resolve({ data: [] }),
      ]);

      const titleMap: Record<string, { title: string; type: string }> = {};
      (blogRes.data || []).forEach((p: any) => { titleMap[p.id] = { title: p.title, type: "Blog" }; });
      (matRes.data || []).forEach((m: any) => { titleMap[m.id] = { title: m.title, type: "Material" }; });
      (vidRes.data || []).forEach((v: any) => { titleMap[v.id] = { title: v.title, type: "Video" }; });

      const allIds = new Set([...blogIds, ...matIds, ...vidIds]);
      const trending: TrendingItem[] = views
        .filter((v: any) => allIds.has(v.content_id) && titleMap[v.content_id])
        .map((v: any) => ({
          content_id: v.content_id,
          view_count: v.view_count,
          title: titleMap[v.content_id].title,
          type: titleMap[v.content_id].type,
        }))
        .slice(0, 5);

      setItems(trending);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" /> Trending Content (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">No trending data yet</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.content_id} className="flex items-center gap-2 py-1.5">
                {typeBadge(item.type)}
                <span className="text-sm text-foreground truncate flex-1 min-w-0">{item.title}</span>
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Eye size={10} /> {item.view_count}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrendingContentWidget;
