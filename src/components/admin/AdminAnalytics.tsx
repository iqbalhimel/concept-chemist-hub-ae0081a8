import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Eye, Clock, Globe, Monitor, Smartphone, Tablet,
  TrendingUp, BarChart3, Activity, RefreshCw, Search
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import AdminPagination, { paginateItems } from "./AdminPagination";

interface VisitorSession {
  id: string;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  screen_resolution: string | null;
  referrer: string | null;
  entry_page: string | null;
  exit_page: string | null;
  pages_viewed: number;
  time_spent_seconds: number;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 80%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(35, 90%, 55%)",
  "hsl(330, 70%, 50%)",
  "hsl(190, 70%, 45%)",
  "hsl(270, 60%, 55%)",
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-primary/10 ${color || "text-primary"}`}>
          <Icon size={22} />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAnalytics() {
  const [sessions, setSessions] = useState<VisitorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(20);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("visitor_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(1000);
    if (data) setSessions(data as unknown as VisitorSession[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-refresh every 15s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchSessions, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchSessions]);

  // Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel("analytics-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "visitor_sessions" }, () => {
        fetchSessions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSessions]);

  // --- Computed Stats ---
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 30);

  const activeVisitors = sessions.filter((s) => s.is_active).length;
  const totalVisitors = sessions.length;
  const uniqueIPs = new Set(sessions.map((s) => s.ip_address).filter(Boolean)).size;
  const visitorsToday = sessions.filter((s) => new Date(s.started_at) >= todayStart).length;
  const visitorsWeek = sessions.filter((s) => new Date(s.started_at) >= weekStart).length;
  const visitorsMonth = sessions.filter((s) => new Date(s.started_at) >= monthStart).length;

  const avgDuration = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.time_spent_seconds, 0) / sessions.length)
    : 0;

  const bounceRate = sessions.length > 0
    ? Math.round((sessions.filter((s) => s.pages_viewed <= 1).length / sessions.length) * 100)
    : 0;

  // Active pages
  const activePages = sessions
    .filter((s) => s.is_active)
    .reduce((acc, s) => {
      const p = s.exit_page || s.entry_page || "/";
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // --- Chart Data ---
  const dailyData = (() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    sessions.forEach((s) => {
      const key = s.started_at.slice(0, 10);
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      visitors: count,
    }));
  })();

  const trafficSources = (() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const src = s.referrer || "Direct";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  })();

  const deviceData = (() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const d = s.device_type || "Unknown";
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const browserData = (() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const b = s.browser || "Unknown";
      map[b] = (map[b] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  })();

  const countryData = (() => {
    const map: Record<string, number> = {};
    sessions.forEach((s) => {
      const c = s.country || "Unknown";
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({ name, value }));
  })();

  // --- Filtered Table Data ---
  const filteredSessions = sessions.filter((s) => {
    const matchSearch =
      !searchTerm ||
      s.ip_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.browser?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDevice = deviceFilter === "all" || s.device_type === deviceFilter;
    return matchSearch && matchDevice;
  });

  const paginatedSessions = paginateItems(filteredSessions, page, pageSize);

  const chartConfig = {
    visitors: { label: "Visitors", color: "hsl(var(--primary))" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Activity size={16} className={activeVisitors > 0 ? "text-green-500 animate-pulse" : "text-muted-foreground"} />
            <span className="font-medium">{activeVisitors} active now</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSessions}>
            <RefreshCw size={14} className="mr-1" /> Refresh
          </Button>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Visitors" value={totalVisitors} />
        <StatCard icon={Eye} label="Unique Visitors" value={uniqueIPs} />
        <StatCard icon={TrendingUp} label="Today" value={visitorsToday} sub={`Week: ${visitorsWeek} · Month: ${visitorsMonth}`} />
        <StatCard icon={Clock} label="Avg Duration" value={formatDuration(avgDuration)} sub={`Bounce: ${bounceRate}%`} />
      </div>

      {/* Active Pages */}
      {Object.keys(activePages).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity size={16} className="text-green-500" /> Currently Active Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(activePages)
                .sort((a, b) => b[1] - a[1])
                .map(([path, count]) => (
                  <span key={path} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {path} <span className="font-semibold">({count})</span>
                  </span>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="daily">Daily Visitors</TabsTrigger>
          <TabsTrigger value="sources">Traffic Sources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="browsers">Browsers</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
        </TabsList>

        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 size={18} /> Visitors (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="visitors" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader><CardTitle className="text-base">Traffic Sources</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={trafficSources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader><CardTitle className="text-base">Device Distribution</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
              <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-md">
                <PieChart>
                  <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="browsers">
          <Card>
            <CardHeader><CardTitle className="text-base">Browser Distribution</CardTitle></CardHeader>
            <CardContent className="flex justify-center">
              <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-md">
                <PieChart>
                  <Pie data={browserData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {browserData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="countries">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe size={18} /> Visitor Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={countryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Visitor Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Visitor Log</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search IP, country, browser..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={deviceFilter} onValueChange={(v) => { setDeviceFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="Desktop">Desktop</SelectItem>
                <SelectItem value="Mobile">Mobile</SelectItem>
                <SelectItem value="Tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Browser</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap text-xs">{formatDate(s.started_at)}</TableCell>
                    <TableCell>
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Live
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Ended</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.ip_address || "—"}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {[s.city, s.country].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="inline-flex items-center gap-1">
                        {s.device_type === "Mobile" ? <Smartphone size={12} /> : s.device_type === "Tablet" ? <Tablet size={12} /> : <Monitor size={12} />}
                        {s.device_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">{s.browser || "—"}</TableCell>
                    <TableCell className="text-xs text-center">{s.pages_viewed}</TableCell>
                    <TableCell className="text-xs">{formatDuration(s.time_spent_seconds)}</TableCell>
                    <TableCell className="text-xs">{s.referrer || "Direct"}</TableCell>
                  </TableRow>
                ))}
                {paginatedSessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No visitor data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-2">
            <AdminPagination
              totalItems={filteredSessions.length}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
