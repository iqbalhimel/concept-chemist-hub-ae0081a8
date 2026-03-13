import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, RefreshCw, Search } from "lucide-react";
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
  logout: "bg-muted text-muted-foreground border-border",
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  login_success: "Login Success",
  login_failed: "Login Failed",
  content_create: "Content Created",
  content_update: "Content Updated",
  content_delete: "Content Deleted",
  file_upload: "File Upload",
  logout: "Logout",
};

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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  const uniqueEventTypes = [...new Set(logs.map((l) => l.event_type))];

  if (loading) return <div className="text-muted-foreground">Loading security logs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield className="text-primary" size={24} />
          <h2 className="font-display text-2xl font-bold text-foreground">Security Logs</h2>
        </div>
        <Button size="sm" variant="outline" onClick={fetchLogs}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: logs.length, color: "text-foreground" },
          { label: "Failed Logins", value: logs.filter((l) => l.event_type === "login_failed").length, color: "text-destructive" },
          { label: "Successful Logins", value: logs.filter((l) => l.event_type === "login_success").length, color: "text-green-400" },
          { label: "Content Changes", value: logs.filter((l) => l.event_type.startsWith("content_")).length, color: "text-blue-400" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-3 text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
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
