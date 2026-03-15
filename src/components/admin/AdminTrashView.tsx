import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminActivity } from "@/lib/activityLogger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import { toast } from "sonner";
import { Search, Undo2, Trash2, Clock, AlertTriangle } from "lucide-react";
import type { ActivityModule } from "@/lib/activityLogger";

interface AdminTrashViewProps {
  tableName: "blog_posts" | "notices" | "study_materials" | "testimonials" | "gallery";
  moduleName: ActivityModule;
  labelSingular: string;
  labelPlural: string;
  getTitle: (item: any) => string;
  getSubtitle?: (item: any) => string;
  onBack: () => void;
}

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

const AdminTrashView = ({
  tableName,
  moduleName,
  labelSingular,
  labelPlural,
  getTitle,
  getSubtitle,
  onBack,
}: AdminTrashViewProps) => {
  const csrfGuard = useCsrfGuard();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(20);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchTrashed(); }, []);

  const fetchTrashed = async () => {
    const { data } = await (supabase as any)
      .from(tableName)
      .select("*")
      .not("trashed_at", "is", null)
      .order("trashed_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => getTitle(item).toLowerCase().includes(q));
  }, [items, searchQuery]);

  useEffect(() => setPage(1), [searchQuery]);

  const paginated = paginateItems(filtered, page, pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = filtered.map((i: any) => i.id);
    setSelectedIds(allIds.every((id: string) => selectedIds.has(id)) ? new Set() : new Set(allIds));
  };

  const restoreItems = async (ids: string[]) => {
    await csrfGuard(async () => {
      setProcessing(true);
      for (const id of ids) {
        await (supabase as any).from(tableName).update({ trashed_at: null }).eq("id", id);
      }
      setItems(prev => prev.filter(i => !ids.includes(i.id)));
      setSelectedIds(new Set());
      toast.success(`${ids.length} ${ids.length === 1 ? labelSingular : labelPlural} restored`);
      ids.forEach(id => {
        const item = items.find(i => i.id === id);
        logAdminActivity({ action: "edit", module: moduleName, itemId: id, itemTitle: item ? getTitle(item) : undefined });
      });
      setProcessing(false);
    });
  };

  const permanentDelete = async (ids: string[]) => {
    if (!window.confirm(`Permanently delete ${ids.length} ${ids.length === 1 ? labelSingular : labelPlural}? This cannot be undone.`)) return;
    await csrfGuard(async () => {
      setProcessing(true);
      for (const id of ids) {
        // For gallery, also clean up storage
        if (tableName === "gallery") {
          const item = items.find(i => i.id === id);
          if (item?.image_url) {
            const urlParts = item.image_url.split("/media/");
            if (urlParts[1]) await supabase.storage.from("media").remove([urlParts[1]]);
          }
        }
        await (supabase as any).from(tableName).delete().eq("id", id);
      }
      setItems(prev => prev.filter(i => !ids.includes(i.id)));
      setSelectedIds(new Set());
      toast.success(`${ids.length} ${ids.length === 1 ? labelSingular : labelPlural} permanently deleted`);
      ids.forEach(id => {
        const item = items.find(i => i.id === id);
        logAdminActivity({ action: "delete", module: moduleName, itemId: id, itemTitle: item ? getTitle(item) : undefined });
      });
      setProcessing(false);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const allSelected = filtered.length > 0 && filtered.every((i: any) => selectedIds.has(i.id));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onBack}>← Back</Button>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
              <Trash2 size={20} className="text-destructive" />
              Trash ({filtered.length})
            </h2>
            <p className="text-xs text-muted-foreground">Deleted {labelPlural.toLowerCase()} can be restored or permanently removed</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={`Search trashed ${labelPlural.toLowerCase()}...`}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Select all row */}
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
          <Button
            size="sm"
            variant="outline"
            disabled={processing}
            onClick={() => restoreItems([...selectedIds])}
          >
            <Undo2 size={14} className="mr-1" /> Restore
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={processing}
            onClick={() => permanentDelete([...selectedIds])}
          >
            <Trash2 size={14} className="mr-1" /> Delete Forever
          </Button>
        </div>
      )}

      {/* Items list */}
      {paginated.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Trash2 size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">Trash is empty</p>
          <p className="text-sm mt-1">Deleted {labelPlural.toLowerCase()} will appear here.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {paginated.map((item: any) => (
            <div
              key={item.id}
              className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/20 transition-colors"
            >
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={() => toggleSelect(item.id)}
                className="h-4 w-4 rounded-[3px] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{getTitle(item)}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {getSubtitle && (
                    <span className="text-xs text-muted-foreground">{getSubtitle(item)}</span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={10} /> Trashed {formatTimeAgo(item.trashed_at)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={processing}
                  onClick={() => restoreItems([item.id])}
                >
                  <Undo2 size={12} className="mr-1" /> Restore
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  disabled={processing}
                  onClick={() => permanentDelete([item.id])}
                >
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

export default AdminTrashView;
