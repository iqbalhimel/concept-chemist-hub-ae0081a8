import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAdminActivity } from "@/lib/activityLogger";
import { slugify } from "@/lib/slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Save, Pencil, X, Loader2, Search, Tag } from "lucide-react";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";

interface TagRow {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

const AdminTags = () => {
  const csrfToken = useCsrfGuard();
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Search & pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(20);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  // Adding
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  // Post counts per tag
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});

  const fetchTags = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("tags")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      toast.error("Failed to load tags");
    } else {
      setTags(data || []);
    }

    // Fetch post counts
    const { data: ptData } = await (supabase as any)
      .from("post_tags")
      .select("tag_id");
    if (ptData) {
      const counts: Record<string, number> = {};
      ptData.forEach((r: any) => {
        counts[r.tag_id] = (counts[r.tag_id] || 0) + 1;
      });
      setPostCounts(counts);
    }

    setLoading(false);
  };

  useEffect(() => { fetchTags(); }, []);

  // Filtered tags
  const filtered = useMemo(() => {
    if (!search.trim()) return tags;
    const q = search.toLowerCase();
    return tags.filter(t => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
  }, [tags, search]);

  const paginated = paginateItems(filtered, page, pageSize);
  const allSelected = paginated.length > 0 && paginated.every(t => selected.has(t.id));

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev);
        paginated.forEach(t => next.delete(t.id));
        return next;
      });
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        paginated.forEach(t => next.add(t.id));
        return next;
      });
    }
  };

  // Create
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const slug = newSlug.trim() || slugify(newName.trim());
    const { error } = await (supabase as any)
      .from("tags")
      .insert({ name: newName.trim(), slug });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Tag already exists" : "Failed to create tag");
    } else {
      toast.success("Tag created");
      logAdminActivity("tags", "create", undefined, newName.trim());
      setAdding(false);
      setNewName("");
      setNewSlug("");
      fetchTags();
    }
    setSaving(false);
  };

  // Update
  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    const slug = editSlug.trim() || slugify(editName.trim());
    const { error } = await (supabase as any)
      .from("tags")
      .update({ name: editName.trim(), slug })
      .eq("id", id);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Tag name/slug already exists" : "Failed to update tag");
    } else {
      toast.success("Tag updated");
      logAdminActivity("tags", "update", id, editName.trim());
      setEditingId(null);
      fetchTags();
    }
    setSaving(false);
  };

  // Delete single
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete tag "${name}"? This will remove it from all posts.`)) return;
    const { error } = await (supabase as any).from("tags").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete tag");
    } else {
      toast.success("Tag deleted");
      logAdminActivity("tags", "delete", id, name);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      fetchTags();
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!window.confirm(`Delete ${ids.length} tag(s)? This will remove them from all posts.`)) return;
    const { error } = await (supabase as any).from("tags").delete().in("id", ids);
    if (error) {
      toast.error("Failed to delete tags");
    } else {
      toast.success(`${ids.length} tag(s) deleted`);
      logAdminActivity("tags", "bulk_delete", undefined, `${ids.length} tags`);
      setSelected(new Set());
      fetchTags();
    }
  };

  const startEdit = (tag: TagRow) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditSlug(tag.slug);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-primary" />
          <h3 className="font-display text-lg font-bold text-foreground">Tags</h3>
          <span className="text-xs text-muted-foreground">({tags.length})</span>
        </div>
        <Button size="sm" onClick={() => { setAdding(true); setNewName(""); setNewSlug(""); }}>
          <Plus size={14} className="mr-1" /> Add Tag
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tags..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Add row */}
      {adding && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
          <Input
            placeholder="Tag name"
            value={newName}
            onChange={e => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }}
            className="h-8 text-sm flex-1"
            autoFocus
          />
          <Input
            placeholder="Slug (auto)"
            value={newSlug}
            onChange={e => setNewSlug(e.target.value)}
            className="h-8 text-sm flex-1"
          />
          <Button size="sm" onClick={handleAdd} disabled={saving || !newName.trim()} className="h-8">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)} className="h-8 w-8 p-0">
            <X size={14} />
          </Button>
        </div>
      )}

      {/* Select All + Bulk Bar */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleSelectAll}
            className="rounded-[3px] h-4 w-4"
          />
          <span className="text-xs text-muted-foreground">Select All</span>
          {selected.size > 0 && (
            <div className="admin-bulk-bar flex items-center gap-2 ml-auto">
              <span className="text-xs font-medium">{selected.size} selected</span>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="h-7 text-xs">
                <Trash2 size={12} className="mr-1" /> Delete
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tag List */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">
          {search ? "No tags match your search." : "No tags yet. Create one to get started."}
        </p>
      ) : (
        <div className="space-y-1">
          {paginated.map(tag => (
            <div
              key={tag.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors min-w-0"
            >
              <Checkbox
                checked={selected.has(tag.id)}
                onCheckedChange={() => toggleSelect(tag.id)}
                className="rounded-[3px] h-4 w-4 shrink-0"
              />
              {editingId === tag.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={e => { setEditName(e.target.value); setEditSlug(slugify(e.target.value)); }}
                    className="h-8 text-sm flex-1 min-w-0"
                    autoFocus
                  />
                  <Input
                    value={editSlug}
                    onChange={e => setEditSlug(e.target.value)}
                    className="h-8 text-sm flex-1 min-w-0"
                  />
                  <Button size="sm" onClick={() => handleUpdate(tag.id)} disabled={saving || !editName.trim()} className="h-8 shrink-0">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 p-0 shrink-0">
                    <X size={14} />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="font-medium text-sm text-foreground truncate">{tag.name}</span>
                    <span className="text-xs text-muted-foreground truncate">/{tag.slug}</span>
                    <span className="text-xs text-muted-foreground">
                      {postCounts[tag.id] || 0} post{(postCounts[tag.id] || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground hidden md:inline shrink-0">
                    {formatDate(tag.created_at)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(tag)} className="h-8 w-8 p-0">
                      <Pencil size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(tag.id, tag.name)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="admin-pagination-footer">
        <AdminPagination
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
        />
      </div>
    </div>
  );
};

export default AdminTags;
