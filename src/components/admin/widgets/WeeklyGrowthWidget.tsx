import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, Bell, Download, Video } from "lucide-react";

interface GrowthItem {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}

const WeeklyGrowthWidget = () => {
  const [items, setItems] = useState<GrowthItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [posts, materials, videos, notices] = await Promise.all([
        supabase.from("blog_posts").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("study_materials").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("educational_videos").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
        supabase.from("notices").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      ]);

      setItems([
        { label: "Blog Posts", count: posts.count || 0, icon: FileText, color: "text-blue-400" },
        { label: "Study Materials", count: materials.count || 0, icon: Download, color: "text-emerald-400" },
        { label: "Videos", count: videos.count || 0, icon: Video, color: "text-purple-400" },
        { label: "Notices", count: notices.count || 0, icon: Bell, color: "text-amber-400" },
      ]);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;

  const total = items.reduce((sum, i) => sum + i.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 size={14} className="text-primary" /> Content Growth (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground flex items-center gap-2">
                <item.icon size={12} className={item.color} /> {item.label}
              </span>
              <span className="text-sm font-medium text-foreground">{item.count}</span>
            </div>
          ))}
          <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total</span>
            <span className="text-sm font-bold text-primary">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyGrowthWidget;
