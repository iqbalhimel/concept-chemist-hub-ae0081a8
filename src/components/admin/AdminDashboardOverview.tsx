import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Bell, Download, Image, MessageSquare, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useInsightsData,
  MostViewedPostsWidget,
  MostViewedMaterialsWidget,
  MostWatchedVideosWidget,
  RecentUploadsWidget,
  ScheduledContentWidget,
  TrashSummaryWidget,
} from "@/components/admin/AdminInsightsWidgets";
import OrphanContentWidget from "@/components/admin/OrphanContentWidget";
import TrendingContentWidget from "@/components/admin/widgets/TrendingContentWidget";
import WeeklyGrowthWidget from "@/components/admin/widgets/WeeklyGrowthWidget";

interface RecentComment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  post_title: string;
}

const StatCard = React.memo(({ icon: Icon, label, count, loading }: { icon: React.ElementType; label: string; count: number; loading: boolean }) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-5">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{loading ? "–" : count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
));
StatCard.displayName = "StatCard";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const AdminDashboardOverview = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ posts: 0, notices: 0, materials: 0, gallery: 0, comments: 0 });
  const [recentComments, setRecentComments] = useState<RecentComment[]>([]);
  const insights = useInsightsData();

  useEffect(() => {
    const fetch = async () => {
      const [posts, notices, materials, gallery, comments, recent] = await Promise.all([
        supabase.from("blog_posts").select("id", { count: "exact", head: true }),
        supabase.from("notices").select("id", { count: "exact", head: true }),
        supabase.from("study_materials").select("id", { count: "exact", head: true }),
        supabase.from("gallery").select("id", { count: "exact", head: true }),
        supabase.from("blog_post_comments").select("id", { count: "exact", head: true }),
        supabase.from("blog_post_comments").select("id, user_name, content, created_at, post_id").order("created_at", { ascending: false }).limit(5),
      ]);

      setCounts({
        posts: posts.count || 0,
        notices: notices.count || 0,
        materials: materials.count || 0,
        gallery: gallery.count || 0,
        comments: comments.count || 0,
      });

      if (recent.data && recent.data.length > 0) {
        const postIds = [...new Set(recent.data.map(c => c.post_id))];
        const { data: postsData } = await supabase.from("blog_posts").select("id, title").in("id", postIds);
        const titleMap: Record<string, string> = {};
        postsData?.forEach(p => { titleMap[p.id] = p.title; });

        setRecentComments(recent.data.map(c => ({
          id: c.id,
          user_name: c.user_name,
          content: c.content,
          created_at: c.created_at,
          post_title: titleMap[c.post_id] || "Unknown Post",
        })));
      }

      setLoading(false);
    };
    fetch();
  }, []);

  const stats = [
    { icon: FileText, label: "Blog Posts", count: counts.posts },
    { icon: Bell, label: "Notices", count: counts.notices },
    { icon: Download, label: "Study Materials", count: counts.materials },
    { icon: Image, label: "Gallery Items", count: counts.gallery },
    { icon: MessageSquare, label: "Comments", count: counts.comments },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Overview of your website content.</p>
      </div>

      {/* 1. Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map(s => (
          <StatCard key={s.label} icon={s.icon} label={s.label} count={s.count} loading={loading} />
        ))}
      </div>

      {/* 2. Content Insights */}
      {!insights.loading && (
        <div>
          <h3 className="font-display text-lg font-bold text-foreground mb-3">Content Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <MostViewedPostsWidget data={insights.topPosts} />
            <MostViewedMaterialsWidget data={insights.topMaterials} />
            <MostWatchedVideosWidget data={insights.topVideos} />
            <TrendingContentWidget />
            <WeeklyGrowthWidget />
          </div>
        </div>
      )}

      {/* 3. Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {[
            { label: "New Blog Post", tab: "blog", icon: FileText },
            { label: "New Notice", tab: "notices", icon: Bell },
            { label: "New Material", tab: "study-materials", icon: Download },
          ].map(a => (
            <Button key={a.tab} variant="outline" size="sm" onClick={() => onNavigate(a.tab)} className="gap-1.5">
              <Plus size={14} /> <a.icon size={14} /> {a.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* 4. Recent Uploads */}
      {!insights.loading && (
        <RecentUploadsWidget data={insights.recent} />
      )}

      {/* 5. Scheduled to Publish */}
      {!insights.loading && (
        <ScheduledContentWidget data={insights.scheduled} />
      )}

      {/* 6. Recent Comments */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2"><MessageSquare size={16} /> Recent Comments</span>
            <button onClick={() => onNavigate("comments")} className="text-xs text-primary hover:underline font-normal">
              View all
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : recentComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            recentComments.map(c => (
              <div key={c.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={12} className="text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{c.user_name}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">on {c.post_title}</p>
                  <p className="text-sm text-foreground/80 mt-0.5 line-clamp-2">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 7. SEO Health */}
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-3">SEO Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OrphanContentWidget />
        </div>
      </div>

      {/* 8. Trash Summary */}
      {!insights.loading && (
        <TrashSummaryWidget data={insights.trashCounts} />
      )}
    </div>
  );
};

export default AdminDashboardOverview;
