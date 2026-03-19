import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Search, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";

interface LoginEntry {
  id: string;
  admin_id: string;
  login_time: string;
  ip_address: string | null;
  device_info: string | null;
  location: string | null;
  success: boolean;
  admin_name?: string;
}

const AdminLoginHistory = () => {
  const [entries, setEntries] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [successFilter, setSuccessFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(20);

  const fetchHistory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_login_history")
      .select("*")
      .order("login_time", { ascending: false })
      .limit(500);
    const entries = (data as LoginEntry[]) || [];

    if (entries.length > 0) {
      const ids = [...new Set(entries.map(e => e.admin_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, name")
        .in("user_id", ids);
      const nameMap: Record<string, string> = {};
      profiles?.forEach(p => { nameMap[p.user_id] = p.name || ""; });
      setEntries(entries.map(e => ({ ...e, admin_name: nameMap[e.admin_id] || "" })));
    } else {
      setEntries(entries);
    }
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (successFilter === "success" && !e.success) return false;
      if (successFilter === "failed" && e.success) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (e.ip_address || "").toLowerCase().includes(q) ||
          (e.device_info || "").toLowerCase().includes(q) ||
          e.admin_id.toLowerCase().includes(q) ||
          (e.admin_name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [entries, search, successFilter]);

  const paged = paginateItems(filtered, page, pageSize);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-1">Admin Login History</h2>
        <p className="text-muted-foreground text-sm">Track all admin login events with IP and device details.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by IP, device, admin..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={successFilter} onValueChange={v => { setSuccessFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchHistory} className="h-9">
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History size={16} className="text-primary" />
            Login Events ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : paged.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No login events found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Admin ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map(e => (
                      <TableRow key={e.id}>
                        <TableCell>
                          {e.success ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-primary">
                              <CheckCircle size={13} /> Success
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-destructive text-xs font-medium">
                              <XCircle size={13} /> Failed
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{e.admin_name || "Unknown"}</span>
                          <br />
                          <span className="font-mono text-[10px]">{e.admin_id.slice(0, 8)}…</span>
                        </TableCell>
                        <TableCell className="text-xs">{e.ip_address || "—"}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{e.device_info || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(e.login_time)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4">
                <AdminPagination
                  total={filtered.length}
                  page={page}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginHistory;
