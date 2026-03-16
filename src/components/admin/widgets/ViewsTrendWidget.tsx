import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

type ViewMode = "page_views" | "content_views";

interface DayPoint {
  date: string;
  views: number;
}

const chartConfig = {
  views: { label: "Views", color: "hsl(var(--primary))" },
};

const buildDayMap = () => {
  const now = new Date();
  const map: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  return map;
};

const formatDayMap = (dayMap: Record<string, number>): DayPoint[] =>
  Object.entries(dayMap).map(([date, views]) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views,
  }));

const ViewsTrendWidget = () => {
  const [mode, setMode] = useState<ViewMode>("page_views");
  const [data, setData] = useState<DayPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (m: ViewMode) => {
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const dayMap = buildDayMap();

    if (m === "page_views") {
      const { data: rows } = await supabase
        .from("page_views")
        .select("viewed_at")
        .gte("viewed_at", sevenDaysAgo);

      (rows || []).forEach((r: any) => {
        const key = new Date(r.viewed_at).toISOString().slice(0, 10);
        if (key in dayMap) dayMap[key]++;
      });
    } else {
      // content_views has no timestamp per view, so show aggregate totals
      // We fetch all content_views and display the total as a flat reference line
      // Since content_views lacks dates, we use page_views grouped by content pages
      const { data: rows } = await supabase
        .from("page_views")
        .select("viewed_at, page_path")
        .gte("viewed_at", sevenDaysAgo);

      const contentPaths = ["/blog/", "/resources", "/videos"];
      (rows || []).forEach((r: any) => {
        const path: string = r.page_path || "";
        if (contentPaths.some(p => path.includes(p))) {
          const key = new Date(r.viewed_at).toISOString().slice(0, 10);
          if (key in dayMap) dayMap[key]++;
        }
      });
    }

    setData(formatDayMap(dayMap));
    setLoading(false);
  }, []);

  useEffect(() => {
    load(mode);
  }, [mode, load]);

  return (
    <Card className="md:col-span-2 xl:col-span-3">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" /> Views Trend (Last 7 Days)
          </span>
          <div className="flex rounded-md border border-border overflow-hidden text-[11px] font-normal">
            <button
              onClick={() => setMode("page_views")}
              className={`px-2.5 py-1 transition-colors ${
                mode === "page_views"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              All Pages
            </button>
            <button
              onClick={() => setMode("content_views")}
              className={`px-2.5 py-1 transition-colors ${
                mode === "content_views"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"
              }`}
            >
              Content Only
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="views"
                stroke="var(--color-views)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ViewsTrendWidget;
