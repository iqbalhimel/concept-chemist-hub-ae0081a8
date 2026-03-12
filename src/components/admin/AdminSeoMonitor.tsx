import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, Activity, Search, AlertTriangle, CheckCircle2,
  XCircle, Globe, Smartphone, Monitor, TrendingUp, Clock, Gauge, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

const SITE_URL = "https://iqbalsir.bd";
const MONITORED_PAGES = [
  { url: `${SITE_URL}/en`, label: "Homepage" },
  { url: `${SITE_URL}/en/blog`, label: "Blog" },
  { url: `${SITE_URL}/en/resources`, label: "Resources" },
  { url: `${SITE_URL}/en/notices`, label: "Notices" },
  { url: `${SITE_URL}/en/testimonials`, label: "Testimonials" },
];

type PageSpeedResult = {
  url: string;
  strategy: string;
  scores: { performance: number; seo: number; accessibility: number; bestPractices: number };
  metrics: { lcp: number; fcp: number; cls: number; tbt: number; si: number; tti: number };
  diagnostics: { title: string; description: string; score: number; savings?: number }[];
  quotaExceeded?: boolean;
  status?: "ok" | "quota_exceeded" | "cached_quota";
  message?: string;
};

type SeoHealthResult = {
  overallScore: number;
  totalIssues: number;
  sitemapStatus: string;
  robotsStatus: string;
  duplicateTitles: string[];
  pages: {
    url: string;
    label: string;
    status: number;
    title: string;
    metaDesc: string;
    hasOgTitle: boolean;
    hasOgDesc: boolean;
    hasCanonical: boolean;
    h1Count: number;
    imgMissingAlt: number;
    issues: string[];
    score: number;
  }[];
  checkedAt: string;
};

type CwvData = {
  metric_name: string;
  avg_value: number;
  good_pct: number;
  needs_improvement_pct: number;
  poor_pct: number;
  total: number;
};

const COLORS = {
  good: "hsl(var(--chart-2))",
  needsImprovement: "hsl(var(--chart-4))",
  poor: "hsl(var(--destructive))",
};

const PIE_COLORS = [COLORS.good, COLORS.needsImprovement, COLORS.poor];

function scoreColor(score: number) {
  if (score >= 90) return "text-green-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

function scoreBg(score: number) {
  if (score >= 90) return "bg-green-500/10 border-green-500/30";
  if (score >= 50) return "bg-yellow-500/10 border-yellow-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function formatMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${Math.round(ms)}ms`;
}

const AdminSeoMonitor = () => {
  const [activeTab, setActiveTab] = useState("pagespeed");
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [pageSpeedResults, setPageSpeedResults] = useState<Record<string, PageSpeedResult>>({});
  const [pageSpeedQuotaMessage, setPageSpeedQuotaMessage] = useState<string | null>(null);
  const [seoHealth, setSeoHealth] = useState<SeoHealthResult | null>(null);
  const [cwvData, setCwvData] = useState<CwvData[]>([]);
  const [cwvTimeline, setCwvTimeline] = useState<any[]>([]);

  // Fetch Core Web Vitals
  const fetchCwv = useCallback(async () => {
    setLoading(l => ({ ...l, cwv: true }));
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await (supabase.from as any)("core_web_vitals")
        .select("*")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const metrics = ["LCP", "FCP", "CLS", "TTFB", "INP", "FID"];
        const aggregated = metrics.map(name => {
          const entries = data.filter(d => d.metric_name === name);
          if (entries.length === 0) return null;
          const avg = entries.reduce((s, e) => s + e.metric_value, 0) / entries.length;
          const good = entries.filter(e => e.rating === "good").length;
          const needs = entries.filter(e => e.rating === "needs-improvement").length;
          const poor = entries.filter(e => e.rating === "poor").length;
          return {
            metric_name: name,
            avg_value: avg,
            good_pct: Math.round((good / entries.length) * 100),
            needs_improvement_pct: Math.round((needs / entries.length) * 100),
            poor_pct: Math.round((poor / entries.length) * 100),
            total: entries.length,
          };
        }).filter(Boolean) as CwvData[];
        setCwvData(aggregated);

        // Timeline data (group by day)
        const days: Record<string, Record<string, number[]>> = {};
        data.forEach(d => {
          const day = d.created_at.substring(0, 10);
          if (!days[day]) days[day] = {};
          if (!days[day][d.metric_name]) days[day][d.metric_name] = [];
          days[day][d.metric_name].push(d.metric_value);
        });
        const timeline = Object.entries(days).map(([day, metrics]) => {
          const entry: any = { date: day };
          Object.entries(metrics).forEach(([name, values]) => {
            entry[name] = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
          });
          return entry;
        });
        setCwvTimeline(timeline);
      }
    } catch (e) {
      toast.error("Failed to load Core Web Vitals");
    }
    setLoading(l => ({ ...l, cwv: false }));
  }, []);

  // Fetch PageSpeed
  const fetchPageSpeed = useCallback(async (url: string, label: string): Promise<"ok" | "quota_exceeded" | "error"> => {
    setLoading(l => ({ ...l, [`ps_${label}`]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("pagespeed", {
        body: { url, strategy: "mobile" },
      });

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error("Empty response from PageSpeed service");
      }

      setPageSpeedResults(r => ({ ...r, [label]: data as PageSpeedResult }));

      if ((data as PageSpeedResult).quotaExceeded) {
        const message = (data as PageSpeedResult).message || "PageSpeed daily quota is exhausted. Please try again later.";
        setPageSpeedQuotaMessage(message);
        toast.error(message);
        return "quota_exceeded";
      }

      return "ok";
    } catch (e) {
      const message = e instanceof Error ? e.message : "PageSpeed request failed";
      const isQuotaError = /quota exceeded|queries per day|429/i.test(message);

      if (isQuotaError) {
        const quotaMessage = "PageSpeed daily quota is exhausted. Try again later or connect your own API key.";
        setPageSpeedQuotaMessage(quotaMessage);
        toast.error(quotaMessage);
        return "quota_exceeded";
      }

      toast.error(`PageSpeed failed for ${label}`);
      return "error";
    } finally {
      setLoading(l => ({ ...l, [`ps_${label}`]: false }));
    }
  }, []);

  const fetchAllPageSpeed = useCallback(async () => {
    setPageSpeedQuotaMessage(null);

    for (let i = 0; i < MONITORED_PAGES.length; i++) {
      const page = MONITORED_PAGES[i];
      const result = await fetchPageSpeed(page.url, page.label);

      if (result === "quota_exceeded") {
        break;
      }

      if (i < MONITORED_PAGES.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1200));
      }
    }
  }, [fetchPageSpeed]);

  // Fetch SEO Health
  const fetchSeoHealth = useCallback(async () => {
    setLoading(l => ({ ...l, seo: true }));
    try {
      const { data, error } = await supabase.functions.invoke("seo-health-check", {
        body: { siteUrl: SITE_URL },
      });
      if (error) throw error;
      setSeoHealth(data);
    } catch (e) {
      toast.error("SEO health check failed");
    }
    setLoading(l => ({ ...l, seo: false }));
  }, []);

  useEffect(() => {
    fetchCwv();
  }, [fetchCwv]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchCwv();
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchCwv]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">SEO & Performance Monitor</h3>
          <p className="text-sm text-muted-foreground">Track site performance, Core Web Vitals, and SEO health</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw size={14} className={`mr-1 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pagespeed" className="text-xs sm:text-sm">
            <Gauge size={14} className="mr-1 hidden sm:inline" /> PageSpeed
          </TabsTrigger>
          <TabsTrigger value="cwv" className="text-xs sm:text-sm">
            <Activity size={14} className="mr-1 hidden sm:inline" /> Web Vitals
          </TabsTrigger>
          <TabsTrigger value="seo-health" className="text-xs sm:text-sm">
            <Search size={14} className="mr-1 hidden sm:inline" /> SEO Health
          </TabsTrigger>
        </TabsList>

        {/* PageSpeed Tab */}
        <TabsContent value="pagespeed" className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Google PageSpeed Insights (Mobile)</p>
              <Button
                size="sm"
                onClick={fetchAllPageSpeed}
                disabled={Object.values(loading).some(v => v)}
              >
                <RefreshCw size={14} className={`mr-1 ${Object.keys(loading).some(k => k.startsWith("ps_") && loading[k]) ? "animate-spin" : ""}`} />
                Run All Tests
              </Button>
            </div>

            {pageSpeedQuotaMessage && (
              <p className="text-xs text-destructive">{pageSpeedQuotaMessage}</p>
            )}
          </div>

          {/* Page cards */}
          <div className="grid gap-3">
            {MONITORED_PAGES.map(page => {
              const result = pageSpeedResults[page.label];
              const isLoading = loading[`ps_${page.label}`];
              return (
                <Card key={page.label} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Globe size={16} className="text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm truncate">{page.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchPageSpeed(page.url, page.label)}
                        disabled={isLoading}
                      >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                      </Button>
                    </div>

                    {isLoading && !result && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                        <RefreshCw size={14} className="animate-spin" /> Analyzing...
                      </div>
                    )}

                    {result && (
                      <>
                        {/* Scores */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                          {Object.entries(result.scores).map(([key, val]) => (
                            <div key={key} className={`rounded-lg border p-2 text-center ${scoreBg(val)}`}>
                              <div className={`text-xl font-bold ${scoreColor(val)}`}>{val}</div>
                              <div className="text-xs text-muted-foreground capitalize">{key === "bestPractices" ? "Best Practices" : key}</div>
                            </div>
                          ))}
                        </div>

                        {/* Core Metrics */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                          {[
                            { label: "LCP", value: result.metrics.lcp },
                            { label: "FCP", value: result.metrics.fcp },
                            { label: "CLS", value: result.metrics.cls, isCls: true },
                            { label: "TBT", value: result.metrics.tbt },
                            { label: "SI", value: result.metrics.si },
                            { label: "TTI", value: result.metrics.tti },
                          ].map(m => (
                            <div key={m.label} className="text-center">
                              <div className="text-sm font-semibold text-foreground">
                                {m.isCls ? m.value.toFixed(3) : formatMs(m.value)}
                              </div>
                              <div className="text-xs text-muted-foreground">{m.label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Diagnostics */}
                        {result.diagnostics.length > 0 && (
                          <div className="mt-3 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Opportunities</p>
                            {result.diagnostics.map((d, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <AlertTriangle size={12} className="text-yellow-500 shrink-0" />
                                <span className="text-muted-foreground truncate">{d.title}</span>
                                {d.savings && (
                                  <Badge variant="outline" className="text-[10px] shrink-0">{formatMs(d.savings)} saved</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {!isLoading && !result && (
                      <p className="text-sm text-muted-foreground py-2">Click refresh to analyze this page</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Comparison Chart */}
          {Object.keys(pageSpeedResults).length > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Performance Score Comparison</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={Object.entries(pageSpeedResults).map(([label, r]) => ({
                    name: label,
                    Performance: r.scores.performance,
                    SEO: r.scores.seo,
                    Accessibility: r.scores.accessibility,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Performance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="SEO" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Accessibility" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Core Web Vitals Tab */}
        <TabsContent value="cwv" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Real User Metrics (Last 7 days)</p>
            <Button size="sm" onClick={fetchCwv} disabled={loading.cwv}>
              <RefreshCw size={14} className={`mr-1 ${loading.cwv ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {cwvData.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No Core Web Vitals data yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Metrics will appear as real users visit your site.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cwvData.map(metric => (
                  <Card key={metric.metric_name} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">{metric.metric_name}</span>
                        <Badge variant="outline" className="text-[10px]">{metric.total} samples</Badge>
                      </div>
                      <div className="text-2xl font-bold text-foreground mb-2">
                        {metric.metric_name === "CLS" ? metric.avg_value.toFixed(3) : formatMs(metric.avg_value)}
                      </div>
                      {/* Distribution bar */}
                      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                        {metric.good_pct > 0 && (
                          <div className="bg-green-500 rounded-full" style={{ width: `${metric.good_pct}%` }} />
                        )}
                        {metric.needs_improvement_pct > 0 && (
                          <div className="bg-yellow-500 rounded-full" style={{ width: `${metric.needs_improvement_pct}%` }} />
                        )}
                        {metric.poor_pct > 0 && (
                          <div className="bg-red-500 rounded-full" style={{ width: `${metric.poor_pct}%` }} />
                        )}
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                        <span className="text-green-500">{metric.good_pct}% good</span>
                        <span className="text-yellow-500">{metric.needs_improvement_pct}% avg</span>
                        <span className="text-red-500">{metric.poor_pct}% poor</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Distribution Pie Charts */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Rating Distribution</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {cwvData.map(metric => (
                      <div key={metric.metric_name} className="text-center">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{metric.metric_name}</p>
                        <ResponsiveContainer width="100%" height={120}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: "Good", value: metric.good_pct },
                                { name: "Needs Improvement", value: metric.needs_improvement_pct },
                                { name: "Poor", value: metric.poor_pct },
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={50}
                              dataKey="value"
                            >
                              {PIE_COLORS.map((color, i) => (
                                <Cell key={i} fill={color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                              formatter={(v: number) => `${v}%`}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Chart */}
              {cwvTimeline.length > 1 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Metrics Trend (7 days)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={cwvTimeline}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="LCP" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="FCP" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="TTFB" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* SEO Health Tab */}
        <TabsContent value="seo-health" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Crawl-based SEO audit for {SITE_URL}</p>
            <Button size="sm" onClick={fetchSeoHealth} disabled={loading.seo}>
              <RefreshCw size={14} className={`mr-1 ${loading.seo ? "animate-spin" : ""}`} />
              Run Health Check
            </Button>
          </div>

          {loading.seo && !seoHealth && (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw size={32} className="mx-auto text-primary animate-spin mb-3" />
                <p className="text-muted-foreground">Running SEO health check...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take 15-30 seconds</p>
              </CardContent>
            </Card>
          )}

          {seoHealth && (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className={`border ${scoreBg(seoHealth.overallScore)}`}>
                  <CardContent className="p-4 text-center">
                    <div className={`text-3xl font-bold ${scoreColor(seoHealth.overallScore)}`}>
                      {seoHealth.overallScore}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Overall Score</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl font-bold text-foreground">{seoHealth.totalIssues}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Issues</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-4 text-center flex flex-col items-center">
                    {seoHealth.sitemapStatus === "ok" ? (
                      <CheckCircle2 size={28} className="text-green-500" />
                    ) : (
                      <XCircle size={28} className="text-red-500" />
                    )}
                    <div className="text-xs text-muted-foreground mt-2">Sitemap</div>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-4 text-center flex flex-col items-center">
                    {seoHealth.robotsStatus === "ok" ? (
                      <CheckCircle2 size={28} className="text-green-500" />
                    ) : (
                      <XCircle size={28} className="text-red-500" />
                    )}
                    <div className="text-xs text-muted-foreground mt-2">Robots.txt</div>
                  </CardContent>
                </Card>
              </div>

              {/* Duplicate Titles Warning */}
              {seoHealth.duplicateTitles.length > 0 && (
                <Card className="border border-yellow-500/30 bg-yellow-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} className="text-yellow-500" />
                      <span className="text-sm font-medium text-foreground">Duplicate Titles Found</span>
                    </div>
                    {seoHealth.duplicateTitles.map((t, i) => (
                      <p key={i} className="text-xs text-muted-foreground ml-6">"{t}"</p>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Page-by-page results */}
              <div className="space-y-3">
                {seoHealth.pages.map((page, i) => (
                  <Card key={i} className="border border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe size={14} className="text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium truncate">{page.label}</span>
                          <Badge variant={page.status === 200 ? "outline" : "destructive"} className="text-[10px]">
                            {page.status}
                          </Badge>
                        </div>
                        <div className={`text-lg font-bold ${scoreColor(page.score)}`}>{page.score}</div>
                      </div>

                      {page.title && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          <span className="text-foreground">Title:</span> {page.title}
                        </p>
                      )}

                      {/* Quick checks */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {[
                          { ok: !!page.title, label: "Title" },
                          { ok: !!page.metaDesc, label: "Meta Desc" },
                          { ok: page.hasOgTitle, label: "OG Title" },
                          { ok: page.hasOgDesc, label: "OG Desc" },
                          { ok: page.hasCanonical, label: "Canonical" },
                          { ok: page.h1Count === 1, label: "H1" },
                          { ok: page.imgMissingAlt === 0, label: "Alt Text" },
                        ].map(check => (
                          <Badge key={check.label} variant="outline" className={`text-[10px] ${check.ok ? "border-green-500/40 text-green-500" : "border-red-500/40 text-red-500"}`}>
                            {check.ok ? <CheckCircle2 size={10} className="mr-0.5" /> : <XCircle size={10} className="mr-0.5" />}
                            {check.label}
                          </Badge>
                        ))}
                      </div>

                      {/* Issues */}
                      {page.issues.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {page.issues.map((issue, j) => (
                            <div key={j} className="flex items-center gap-1.5 text-xs text-red-400">
                              <AlertTriangle size={10} className="shrink-0" />
                              <span>{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Score comparison chart */}
              <Card>
                <CardHeader><CardTitle className="text-sm">Page SEO Scores</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={seoHealth.pages.map(p => ({ name: p.label, Score: p.score }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="Score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground text-right">
                <Clock size={10} className="inline mr-1" />
                Last checked: {new Date(seoHealth.checkedAt).toLocaleString()}
              </p>
            </>
          )}

          {!loading.seo && !seoHealth && (
            <Card>
              <CardContent className="py-12 text-center">
                <Search size={40} className="mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Click "Run Health Check" to audit your site's SEO</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSeoMonitor;
