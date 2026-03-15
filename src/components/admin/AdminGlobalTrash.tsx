import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminActivity } from "@/lib/activityLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Search, Undo2, Trash2, Clock, AlertTriangle } from "lucide-react";
import type { ActivityModule } from "@/lib/activityLogger";

/* ── Module config ─────────────────────────────────────────── */

interface ModuleConfig {
  table: string;
  module: ActivityModule;
  label: string;
  badgeClass: string;
  getTitle: (r: any) => string;
  getSubtitle?: (r: any) => string;
}

const MODULES: ModuleConfig[] = [
  {
    table: "blog_posts",
    module: "blog_posts",
    label: "Blog",
    badgeClass: "border-primary/40 text-primary bg-primary/10",
    getTitle: r => r.title || "Untitled",
    getSubtitle: r => r.category,
  },
  {
    table: "notices",
    module: "notices",
    label: "Notice",
    badgeClass: "border-amber-500/40 text-amber-600 bg-amber-500/10 dark:text-amber-400",
    getTitle: r => r.title || "Untitled",
  },
  {
    table: "study_materials",
    module: "study_materials",
    label: "Study Material",
    badgeClass: "border-emerald-500/40 text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
    getTitle: r => r.title || "Untitled",
    getSubtitle: r => r.category,
  },
  {
    table: "testimonials",
    module: "testimonials",
    label: "Testimonial",
    badgeClass: "border-violet-500/40 text-violet-600 bg-violet-500/10 dark:text-violet-400",
    getTitle: r => r.student_name || "Untitled",
    getSubtitle: r => r.student_info,
  },
  {
    table: "gallery",
    module: "gallery",
    label: "Gallery",
    badgeClass: "border-rose-500/40 text-rose-600 bg-rose-500/10 dark:text-rose-400",
    getTitle: r => r.label || r.alt || "Image",
  },
];

/* ── Helpers ───────────────────────────────────────────────── */

interface TrashItem {
  id: string;
  _module: ModuleConfig;
  _title: string;
  _subtitle?: string;
  trashed_at: string;
  // raw row data for storage cleanup
  _raw: any;
}

const AUTO_DELETE_DAYS = 30;

const getDaysRemaining = (trashedAt: string) => {
  const deleteAt = new Date(trashedAt).getTime() + AUTO_DELETE_DAYS * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((deleteAt - Date.now()) / (24 * 60 * 60 * 1000)));
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

const DaysRemainingBadge = ({ trashedAt }: { trashedAt: string }) => {
  const days = getDaysRemaining(trashedAt);
  const urgent = days <= 3;
  const warning = days <= 7;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[10px] px-1.5 py-0 font-medium whitespace-nowrap",
        urgent
          ? "border-destructive/50 text-destructive bg-destructive/10"
          : warning
            ? "border-orange-500/50 text-orange-600 bg-orange-500/10 dark:text-orange-400"
            : "border-muted-foreground/30 text-muted-foreground"
      )}
    >
      <AlertTriangle size={9} className={cn("mr-0.5", urgent && "animate-pulse")} />
      {days === 0 ? "Deleting soon" : `${days}d left`}
    </Badge>
  );
};

/* ── Component ─────────────────────────────────────────────── */

const AdminGlobalTrash = () => {
  const csrfGuard = useCsrfGuard();
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(20);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const results: TrashItem[] = [];

    const promises = MODULES.map(async (mod) => {
      const { data } = await (supabase as any)
        .from(mod.table)
        .select("*")
        .not("trashed_at", "is", null)
        .order("trashed_at", { ascending: false });

      if (data) {
        for (const row of data) {
          results.push({
            id: `${mod.table}::${row.id}`,
            _module: mod,
            _title: mod.getTitle(row),
            _subtitle: mod.getSubtitle?.(row),
            trashed_at: row.trashed_at,
            _raw: row,
          });
        }
      }
    });

    await Promise.all(promises);
    results.sort((a, b) => new Date(b.trashed_at).getTime() - new Date(a.trashed_at).getTime());
    setItems(results);
    setLoading(false);
  };

  /* ── Filtering ──────────────────────────────────── */

  const filtered = useMemo(() => {
    let list = items;
    if (moduleFilter !== "all") {
      list = list.filter(i => i._module.table === moduleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => i._title.toLowerCase().includes(q));
    }
    return list;
  }, [items, moduleFilter, searchQuery]);

  useEffect(() => setPage(1), [searchQuery, moduleFilter]);

  const paginated = paginateItems(filtered, page, pageSize);

  /* ── Module counts ──────────────────────────────── */

  const moduleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item._module.table] = (counts[item._module.table] || 0) + 1;
    }
    return counts;
  }, [items]);

  /* ── Selection ──────────────────────────────────── */

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = filtered.map(i => i.id);
    setSelectedIds(allIds.every(id => selectedIds.has(id)) ? new Set() : new Set(allIds));
  };

  /* ── Actions ────────────────────────────────────── */

  const restoreItems = async (ids: string[]) => {
    await csrfGuard(async () => {
      setProcessing(true);
      const targets = items.filter(i => ids.includes(i.id));

      // Group by table for efficiency
      const grouped = new Map<string, TrashItem[]>();
      for (const t of targets) {
        const list = grouped.get(t._module.table) || [];
        list.push(t);
        grouped.set(t._module.table, list);
      }

      for (const [table, tableItems] of grouped) {
        for (const item of tableItems) {
          await (supabase as any).from(table).update({ trashed_at: null }).eq("id", item._raw.id);
          logAdminActivity({ action: "edit", module: item._module.module, itemId: item._raw.id, itemTitle: item._title });
        }
      }

      setItems(prev => prev.filter(i => !ids.includes(i.id)));
      setSelectedIds(new Set());
      toast.success(`${targets.length} item${targets.length > 1 ? "s" : ""} restored`);
      setProcessing(false);
    });
  };

  const permanentDelete = async (ids: string[]) => {
    const targets = items.filter(i => ids.includes(i.id));
    if (!window.confirm(`Permanently delete ${targets.length} item${targets.length > 1 ? "s" : ""}? This cannot be undone.`)) return;

    await csrfGuard(async () => {
      setProcessing(true);

      for (const item of targets) {
        // Gallery storage cleanup
        if (item._module.table === "gallery" && item._raw.image_url) {
          const urlParts = item._raw.image_url.split("/media/");
          if (urlParts[1]) await supabase.storage.from("media").remove([urlParts[1]]);
        }

        await (supabase as any).from(item._module.table).delete().eq("id", item._raw.id);
        logAdminActivity({ action: "delete", module: item._module.module, itemId: item._raw.id, itemTitle: item._title });
      }

      setItems(prev => prev.filter(i => !ids.includes(i.id)));
      setSelectedIds(new Set());
      toast.success(`${targets.length} item${targets.length > 1 ? "s" : ""} permanently deleted`);
      setProcessing(false);
    });
  };

  /* ── Render ─────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const allSelected = filtered.length > 0 && filtered.every(i => selectedIds.has(i.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Trash2 size={20} className="text-destructive" />
            Global Trash ({items.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            All deleted items across modules · Auto-deleted after 30 days
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search trashed items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules ({items.length})</SelectItem>
            {MODULES.map(m => {
              const count = moduleCounts[m.table] || 0;
              if (count === 0) return null;
              return (
                <SelectItem key={m.table} value={m.table}>
                  {m.label} ({count})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Select all */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-1.5">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            className="h-4 w-4 rounded-[3px]"
          />
          <span className="text-xs text-muted-foreground">Select all</span>
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="admin-bulk-bar flex items-center gap-2 bg-muted/80 border border-border rounded-lg px-4 py-2">
          <span className="text-sm font-medium mr-2">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" disabled={processing} onClick={() => restoreItems([...selectedIds])}>
            <Undo2 size={14} className="mr-1" /> Restore
          </Button>
          <Button size="sm" variant="destructive" disabled={processing} onClick={() => permanentDelete([...selectedIds])}>
            <Trash2 size={14} className="mr-1" /> Delete Forever
          </Button>
        </div>
      )}

      {/* Content list */}
      {paginated.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trash2 size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Trash is empty</p>
          <p className="text-sm mt-1">Deleted items from all modules will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {paginated.map((item: TrashItem) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/20 transition-colors"
            >
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => toggleSelect(item.id)}
                className="h-4 w-4 rounded-[3px] shrink-0"
              />

              {/* Module badge */}
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0 font-semibold whitespace-nowrap shrink-0", item._module.badgeClass)}
              >
                {item._module.label}
              </Badge>

              {/* Title + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item._title}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {item._subtitle && (
                    <span className="text-xs text-muted-foreground">{item._subtitle}</span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={10} /> Trashed {formatTimeAgo(item.trashed_at)}
                  </span>
                  <DaysRemainingBadge trashedAt={item.trashed_at} />
                </div>
              </div>

              {/* Row actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" variant="outline" className="h-7 text-xs" disabled={processing} onClick={() => restoreItems([item.id])}>
                  <Undo2 size={12} className="mr-1" /> Restore
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" disabled={processing} onClick={() => permanentDelete([item.id])}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

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

export default AdminGlobalTrash;
