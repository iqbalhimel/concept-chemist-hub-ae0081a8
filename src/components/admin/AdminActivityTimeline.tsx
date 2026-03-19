import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Pencil, Trash2, Upload, Settings, Globe, Clock } from "lucide-react";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";

interface ActivityEntry {
  id: string;
  user_id: string;
  action_type: string;
  module: string;
  item_id: string | null;
  item_title: string | null;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  create: { label: "Created", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20", icon: FileText },
  edit: { label: "Edited", color: "bg-blue-500/15 text-blue-600 border-blue-500/20", icon: Pencil },
  delete: { label: "Deleted", color: "bg-red-500/15 text-red-600 border-red-500/20", icon: Trash2 },
  upload: { label: "Uploaded", color: "bg-violet-500/15 text-violet-600 border-violet-500/20", icon: Upload },
  update_settings: { label: "Updated Settings", color: "bg-amber-500/15 text-amber-600 border-amber-500/20", icon: Settings },
  update_seo: { label: "Updated SEO", color: "bg-cyan-500/15 text-cyan-600 border-cyan-500/20", icon: Globe },
};

const MODULE_LABELS: Record<string, string> = {
  blog_posts: "Blog Posts", notices: "Notices", study_materials: "Study Materials",
  educational_videos: "Videos", gallery: "Gallery", testimonials: "Testimonials",
  faq: "FAQ", media_library: "Media", subjects: "Subjects", achievements: "Achievements",
  experience: "Experience", education: "Education", professional_training: "Training",
  teaching_approach: "Approach", themes: "Themes", site_settings: "Site Settings",
  seo: "SEO", blog_categories: "Blog Categories", tags: "Blog Tags",
  homepage_sections: "Homepage Sections",
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatFullDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const AdminActivityTimeline = () => {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("__all__");
  const [filterAction, setFilterAction] = useState("__all__");
  const [filterDateRange, setFilterDateRange] = useState("__all__");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(25);

  useEffect(() => { fetchEntries(); }, []);

  const fetchEntries = async () => {
    const { data } = await (supabase as any)
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setEntries(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let result = entries;

    if (filterModule !== "__all__") result = result.filter(e => e.module === filterModule);
    if (filterAction !== "__all__") result = result.filter(e => e.action_type === filterAction);

    if (filterDateRange !== "__all__") {
      const now = Date.now();
      const ranges: Record<string, number> = {
        "24h": 86400000, "7d": 604800000, "30d": 2592000000,
      };
      const ms = ranges[filterDateRange];
      if (ms) result = result.filter(e => now - new Date(e.created_at).getTime() < ms);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        (e.item_title?.toLowerCase().includes(q)) ||
        (e.module.toLowerCase().includes(q)) ||
        (e.action_type.toLowerCase().includes(q))
      );
    }

    return result;
  }, [entries, filterModule, filterAction, filterDateRange, search]);

  useEffect(() => setPage(1), [search, filterModule, filterAction, filterDateRange]);

  const paginated = paginateItems(filtered, page, pageSize);
  const modules = useMemo(() => [...new Set(entries.map(e => e.module))].sort(), [entries]);
  const actions = useMemo(() => [...new Set(entries.map(e => e.action_type))].sort(), [entries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm text-muted-foreground">{filtered.length} activities recorded</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Module" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Modules</SelectItem>
            {modules.map(m => (
              <SelectItem key={m} value={m}>{MODULE_LABELS[m] || m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Actions</SelectItem>
            {actions.map(a => (
              <SelectItem key={a} value={a}>{ACTION_CONFIG[a]?.label || a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDateRange} onValueChange={setFilterDateRange}>
          <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Date range" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Time</SelectItem>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {paginated.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock size={40} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">No activity yet</p>
            <p className="text-sm mt-1">Admin actions will appear here as they happen.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border hidden sm:block" />

            {paginated.map((entry, idx) => {
              const config = ACTION_CONFIG[entry.action_type] || ACTION_CONFIG.edit;
              const Icon = config.icon;
              return (
                <div key={entry.id} className="relative flex gap-3 py-3 group">
                  {/* Timeline dot */}
                  <div className="hidden sm:flex shrink-0 w-10 h-10 rounded-full bg-card border border-border items-center justify-center z-10 group-hover:border-primary/40 transition-colors">
                    <Icon size={16} className="text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 bg-card rounded-lg border border-border p-3 hover:border-primary/20 transition-colors">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-xs font-medium ${config.color}`}>
                          {config.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {MODULE_LABELS[entry.module] || entry.module}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0" title={formatFullDate(entry.created_at)}>
                        {formatTimeAgo(entry.created_at)}
                      </span>
                    </div>
                    <p className="text-sm mt-1.5 text-foreground">
                      <span className="text-muted-foreground">Admin</span>{" "}
                      {config.label.toLowerCase()}{" "}
                      {MODULE_LABELS[entry.module]?.toLowerCase() || entry.module}
                      {entry.item_title && (
                        <> — <span className="font-medium">"{entry.item_title}"</span></>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="admin-pagination-footer pt-4">
        <AdminPagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>
    </div>
  );
};

export default AdminActivityTimeline;
