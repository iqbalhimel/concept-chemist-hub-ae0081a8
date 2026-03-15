import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Download, Video, Clock, Trash2, CalendarClock, FileText, TrendingUp } from "lucide-react";

interface ViewItem {
  content_id: string;
  view_count: number;
  title?: string;
}

interface RecentItem {
  id: string;
  title: string;
  type: string;
  created_at: string;
}

interface ScheduledItem {
  id: string;
  title: string;
  type: string;
  scheduled_at: string;
}

interface TrashCount {
  module: string;
  count: number;
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const MiniList = ({ items, emptyMsg }: { items: React.ReactNode[]; emptyMsg: string }) => (
  <div className="space-y-2">
    {items.length === 0 ? (
      <p className="text-xs text-muted-foreground">{emptyMsg}</p>
    ) : items}
  </div>
);

const AdminInsightsWidgets = () => {
  const [topPosts, setTopPosts] = useState<ViewItem[]>([]);
  const [topMaterials, setTopMaterials] = useState<ViewItem[]>([]);
  const [topVideos, setTopVideos] = useState<ViewItem[]>([]);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledItem[]>([]);
  const [trashCounts, setTrashCounts] = useState<TrashCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const now = new Date().toISOString();

      // Fetch all data in parallel
      const [viewsRes, postsRes, matsRes, vidsRes, scheduledPostsRes, scheduledNoticesRes, scheduledMatsRes, scheduledVidsRes, trashPostsRes, trashNoticesRes, trashMatsRes, trashTestRes, trashGalleryRes] = await Promise.all([
        // Top views
        (supabase as any).from("content_views").select("content_type, content_id, view_count").order("view_count", { ascending: false }).limit(30),
        // Recent uploads
        supabase.from("blog_posts").select("id, title, created_at").is("trashed_at", null).order("created_at", { ascending: false }).limit(3),
        supabase.from("study_materials").select("id, title, created_at").is("trashed_at" as any, null).order("created_at", { ascending: false }).limit(3),
        supabase.from("educational_videos").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
        // Scheduled
        supabase.from("blog_posts").select("id, title, scheduled_at").is("trashed_at", null).not("scheduled_at", "is", null).gt("scheduled_at", now).eq("is_published", false),
        supabase.from("notices").select("id, title, publish_at").is("trashed_at" as any, null).not("publish_at", "is", null).gt("publish_at", now).eq("is_active", false),
        supabase.from("study_materials").select("id, title, publish_at").is("trashed_at" as any, null).not("publish_at", "is", null).gt("publish_at", now).eq("is_active", false),
        supabase.from("educational_videos").select("id, title, publish_at").not("publish_at", "is", null).gt("publish_at", now).eq("is_published", false),
        // Trash counts
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).not("trashed_at", "is", null),
        supabase.from("notices").select("id", { count: "exact", head: true }).not("trashed_at", "is", null),
        (supabase as any).from("study_materials").select("id", { count: "exact", head: true }).not("trashed_at", "is", null),
        supabase.from("testimonials").select("id", { count: "exact", head: true }).not("trashed_at", "is", null),
        supabase.from("gallery").select("id", { count: "exact", head: true }).not("trashed_at", "is", null),
      ]);

      // Process top views by type
      const views = viewsRes.data || [];
      const blogViews = views.filter(v => v.content_type === "blog_post").slice(0, 5);
      const matViews = views.filter(v => v.content_type === "study_material").slice(0, 5);
      const vidViews = views.filter(v => v.content_type === "video").slice(0, 5);

      // Resolve titles for top viewed items
      const resolveNames = async (items: any[], table: string): Promise<ViewItem[]> => {
        if (items.length === 0) return [];
        const ids = items.map(i => i.content_id);
        const { data } = await (supabase as any).from(table).select("id, title").in("id", ids);
        const titleMap: Record<string, string> = {};
        data?.forEach((d: any) => { titleMap[d.id] = d.title; });
        return items.map(i => ({ content_id: i.content_id, view_count: i.view_count, title: titleMap[i.content_id] || "Unknown" }));
      };

      const [resolvedPosts, resolvedMats, resolvedVids] = await Promise.all([
        resolveNames(blogViews, "blog_posts"),
        resolveNames(matViews, "study_materials"),
        resolveNames(vidViews, "educational_videos"),
      ]);

      setTopPosts(resolvedPosts);
      setTopMaterials(resolvedMats);
      setTopVideos(resolvedVids);

      // Recent uploads - merge and sort
      const allRecent: RecentItem[] = [
        ...(postsRes.data || []).map((p: any) => ({ id: p.id, title: p.title, type: "Blog", created_at: p.created_at })),
        ...(matsRes.data || []).map((m: any) => ({ id: m.id, title: m.title, type: "Material", created_at: m.created_at })),
        ...(vidsRes.data || []).map((v: any) => ({ id: v.id, title: v.title, type: "Video", created_at: v.created_at })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
      setRecent(allRecent);

      // Scheduled
      const allScheduled: ScheduledItem[] = [
        ...(scheduledPostsRes.data || []).map((p: any) => ({ id: p.id, title: p.title, type: "Blog", scheduled_at: p.scheduled_at })),
        ...(scheduledNoticesRes.data || []).map((n: any) => ({ id: n.id, title: n.title, type: "Notice", scheduled_at: n.publish_at })),
        ...(scheduledMatsRes.data || []).map((m: any) => ({ id: m.id, title: m.title, type: "Material", scheduled_at: m.publish_at })),
        ...(scheduledVidsRes.data || []).map((v: any) => ({ id: v.id, title: v.title, type: "Video", scheduled_at: v.publish_at })),
      ].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      setScheduled(allScheduled);

      // Trash
      const tc: TrashCount[] = [
        { module: "Blog Posts", count: trashPostsRes.count || 0 },
        { module: "Notices", count: trashNoticesRes.count || 0 },
        { module: "Materials", count: trashMatsRes.count || 0 },
        { module: "Testimonials", count: trashTestRes.count || 0 },
        { module: "Gallery", count: trashGalleryRes.count || 0 },
      ].filter(t => t.count > 0);
      setTrashCounts(tc);

      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Blog: "bg-blue-500/15 text-blue-400",
      Material: "bg-emerald-500/15 text-emerald-400",
      Video: "bg-purple-500/15 text-purple-400",
      Notice: "bg-amber-500/15 text-amber-400",
    };
    return (
      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${colors[type] || "bg-muted text-muted-foreground"}`}>
        {type}
      </span>
    );
  };

  const viewRow = (item: ViewItem) => (
    <div key={item.content_id} className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-sm text-foreground truncate flex-1 min-w-0">{item.title}</span>
      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
        <Eye size={10} /> {item.view_count}
      </span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Most Viewed Blog Posts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> Most Viewed Posts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniList items={topPosts.map(viewRow)} emptyMsg="No view data yet" />
        </CardContent>
      </Card>

      {/* Most Downloaded Materials */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Download size={14} className="text-primary" /> Most Viewed Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniList items={topMaterials.map(viewRow)} emptyMsg="No view data yet" />
        </CardContent>
      </Card>

      {/* Most Watched Videos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Video size={14} className="text-primary" /> Most Watched Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniList items={topVideos.map(viewRow)} emptyMsg="No view data yet" />
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock size={14} className="text-primary" /> Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniList
            items={recent.map(r => (
              <div key={r.id} className="flex items-center gap-2 py-1.5">
                {typeBadge(r.type)}
                <span className="text-sm text-foreground truncate flex-1 min-w-0">{r.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(r.created_at)}</span>
              </div>
            ))}
            emptyMsg="No recent uploads"
          />
        </CardContent>
      </Card>

      {/* Scheduled Content */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarClock size={14} className="text-primary" /> Scheduled to Publish
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniList
            items={scheduled.map(s => (
              <div key={s.id} className="flex items-center gap-2 py-1.5">
                {typeBadge(s.type)}
                <span className="text-sm text-foreground truncate flex-1 min-w-0">{s.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(s.scheduled_at)}</span>
              </div>
            ))}
            emptyMsg="Nothing scheduled"
          />
        </CardContent>
      </Card>

      {/* Trash Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trash2 size={14} className="text-primary" /> Trash Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MiniList
            items={trashCounts.map(tc => (
              <div key={tc.module} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-foreground">{tc.module}</span>
                <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">{tc.count}</span>
              </div>
            ))}
            emptyMsg="Trash is empty"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInsightsWidgets;
