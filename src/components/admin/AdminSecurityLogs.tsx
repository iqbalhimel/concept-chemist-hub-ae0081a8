import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, RefreshCw, Search, LogIn, AlertTriangle, Upload, Settings, Clock, Globe } from "lucide-react";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";

interface SecurityLog {
  id: string;
  event_type: string;
  description: string;
  ip_address: string | null;
  user_email: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  login_success: "bg-green-500/15 text-green-400 border-green-500/30",
  login_failed: "bg-destructive/15 text-destructive border-destructive/30",
  content_create: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  content_update: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  content_delete: "bg-red-500/15 text-red-400 border-red-500/30",
  file_upload: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  csrf_error: "bg-destructive/15 text-destructive border-destructive/30",
  logout: "bg-muted text-muted-foreground border-border",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  login_success: "Login Success",
  login_failed: "Login Failed",
  content_create: "Content Created",
  content_update: "Content Updated",
  content_delete: "Content Deleted",
  file_upload: "File Upload",
  csrf_error: "CSRF Error",
  logout: "Logout",
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/* ─── Dashboard Cards ─── */
const SecurityDashboard = ({ logs }: { logs: SecurityLog[] }) => {
  const stats = useMemo(() => {
    const now = Date.now();
    const last24h = logs.filter(l => now - new Date(l.created_at).getTime() < 86400000);
    const last7d = logs.filter(l => now - new Date(l.created_at).getTime() < 604800000);

    return {
      totalEvents: logs.length,
      failedLogins24h: last24h.filter(l => l.event_type === "login_failed").length,
      successfulLogins24h: last24h.filter(l => l.event_type === "login_success").length,
      contentChanges7d: last7d.filter(l => l.event_type.startsWith("content_")).length,
      uploads7d: last7d.filter(l => l.event_type === "file_upload").length,
      csrfErrors: logs.filter(l => l.event_type === "csrf_error").length,
      uniqueIPs: new Set(last7d.map(l => l.ip_address).filter(Boolean)).size,
    };
  }, [logs]);

  const recentLogins = useMemo(() =>
    logs.filter(l => l.event_type === "login_success" || l.event_type === "login_failed").slice(0, 5),
    [logs]
  );

  const recentActions = useMemo(() =>
    logs.filter(l => l.event_type.startsWith("content_") || l.event_type === "file_upload").slice(0, 5),
    [logs]
  );

  const recentFailures = useMemo(() =>
    logs.filter(l => l.event_type === "login_failed").slice(0, 5),
    [logs]
  );

  const summaryCards = [
    { label: "Failed Logins (24h)", value: stats.failedLogins24h, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Successful Logins (24h)", value: stats.successfulLogins24h, icon: LogIn, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Content Changes (7d)", value: stats.contentChanges7d, icon: Settings, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "File Uploads (7d)", value: stats.uploads7d, icon: Upload, color: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Unique IPs (7d)", value: stats.uniqueIPs, icon: Globe, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "CSRF Errors", value: stats.csrfErrors, icon: Shield, color: stats.csrfErrors > 0 ? "text-destructive" : "text-muted-foreground", bg: stats.csrfErrors > 0 ? "bg-destructive/10" : "bg-muted" },
  ];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="glass-card p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-md ${card.bg}`}>
                <card.icon size={14} className={card.color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Login Attempts */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <LogIn size={16} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Recent Login Attempts</h3>
          </div>
          {recentLogins.length === 0 ? (
            <p className="text-xs text-muted-foreground">No login attempts recorded.</p>
          ) : (
            <div className="space-y-2">
              {recentLogins.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${log.event_type === "login_success" ? "bg-green-400" : "bg-destructive"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate">{log.user_email || "Unknown"}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{formatTimeAgo(log.created_at)}</span>
                      {log.ip_address && <span>· {log.ip_address}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Failed Login Attempts */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Failed Logins</h3>
          </div>
          {recentFailures.length === 0 ? (
            <p className="text-xs text-muted-foreground">No failed login attempts.</p>
          ) : (
            <div className="space-y-2">
              {recentFailures.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <div className="mt-0.5 w-2 h-2 rounded-full shrink-0 bg-destructive" />
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate">{log.user_email || "Unknown"}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock size={10} className="shrink-0" />
                      <span>{formatDate(log.created_at)}</span>
                    </div>
                    {log.ip_address && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe size={10} className="shrink-0" />
                        <span>{log.ip_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Admin Actions */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Settings size={16} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-foreground">Recent Admin Actions</h3>
          </div>
          {recentActions.length === 0 ? (
            <p className="text-xs text-muted-foreground">No admin actions recorded.</p>
          ) : (
            <div className="space-y-2">
              {recentActions.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] px-1.5 py-0 ${EVENT_TYPE_COLORS[log.event_type] || "bg-muted text-muted-foreground border-border"}`}
                  >
                    {EVENT_TYPE_LABELS[log.event_type] || log.event_type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate">{log.description || "—"}</p>
                    <span className="text-muted-foreground">{formatTimeAgo(log.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const AdminSecurityLogs = () => {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(25);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("security_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Failed to fetch security logs:", error);
    }
    setLogs((data as SecurityLog[]) || []);
    setLoading(false);
  };

  const filtered = logs.filter((log) => {
    const matchesType = filterType === "all" || log.event_type === filterType;
    const matchesSearch =
      !searchQuery ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address?.includes(searchQuery) ||
      log.event_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const paginated = paginateItems(filtered, page, pageSize);
  const uniqueEventTypes = [...new Set(logs.map((l) => l.event_type))];

  if (loading) return <div className="text-muted-foreground">Loading security logs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield className="text-primary" size={24} />
          <h2 className="font-display text-2xl font-bold text-foreground">Security Dashboard</h2>
        </div>
        <Button size="sm" variant="outline" onClick={fetchLogs}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </div>

      {/* Dashboard Section */}
      <SecurityDashboard logs={logs} />

      {/* Divider */}
      <div className="border-t border-border pt-4">
        <h3 className="text-lg font-semibold text-foreground mb-3">All Security Logs</h3>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search by description, email, or IP..."
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {uniqueEventTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {EVENT_TYPE_LABELS[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log entries */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No security logs found.</p>
      ) : (
        <div className="space-y-2">
          {paginated.map((log) => (
            <div key={log.id} className="glass-card p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-xs ${EVENT_TYPE_COLORS[log.event_type] || "bg-muted text-muted-foreground border-border"}`}
                  >
                    {EVENT_TYPE_LABELS[log.event_type] || log.event_type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{log.description || "—"}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {log.user_email && <span>👤 {log.user_email}</span>}
                      {log.ip_address && <span>🌐 {log.ip_address}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {formatDate(log.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AdminPagination
        total={filtered.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default AdminSecurityLogs;
