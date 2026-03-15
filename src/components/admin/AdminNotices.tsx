import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical, Pin, AlertTriangle, Pencil, Search, X, CalendarClock } from "lucide-react";
import ContentSchedulingFields, { getContentStatus, ContentStatusBadge } from "@/components/admin/ContentSchedulingFields";
import { Checkbox } from "@/components/ui/checkbox";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Tables } from "@/integrations/supabase/types";
import SeoFieldsPanel from "@/components/admin/SeoFieldsPanel";
import { validateTextInput, stripHtml } from "@/lib/sanitize";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";

type Notice = Tables<"notices">;

const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
};

const SortableRow = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start">
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none pt-3.5 pl-3 pr-1"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};

const AdminNotices = () => {
  const csrfGuard = useCsrfGuard();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [newNoticeId, setNewNoticeId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
  const [expandedDeleteId, setExpandedDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const newTitleRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => { fetchNotices(); }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (orderDirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [orderDirty]);

  useEffect(() => {
    if (newNoticeId) {
      setExpandedEditId(newNoticeId);
      setExpandedDeleteId(null);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => { newTitleRef.current?.focus(); setNewNoticeId(null); }, 100);
    }
  }, [newNoticeId]);

  const fetchNotices = async () => {
    const { data } = await supabase.from("notices").select("*").order("sort_order", { ascending: true });
    setNotices(data || []);
    setLoading(false);
    setOrderDirty(false);
  };

  const filteredNotices = useMemo(() => {
    if (!searchQuery.trim()) return notices;
    const q = searchQuery.toLowerCase();
    return notices.filter(n =>
      n.title.toLowerCase().includes(q) ||
      (n.description || "").toLowerCase().includes(q)
    );
  }, [notices, searchQuery]);

  const isFiltering = searchQuery.trim() !== "";

  const addNotice = async () => {
    await csrfGuard(async () => {
      const { data, error } = await supabase
        .from("notices")
        .insert({ title: "New Notice", description: "", date: new Date().toISOString().split("T")[0], sort_order: 0 })
        .select().single();
      if (error || !data) { toast.error(error?.message || "Failed"); return; }
      const updated = notices.map((n, i) => ({ ...n, sort_order: i + 1 }));
      for (const u of updated) {
        await supabase.from("notices").update({ sort_order: u.sort_order }).eq("id", u.id);
      }
      setNotices([data, ...updated]);
      setNewNoticeId(data.id);
      toast.success("Notice added");
    });
  };

  const updateNotice = async (n: Notice) => {
    const titleErr = validateTextInput(n.title, "Title", { required: true, maxLength: 300 });
    if (titleErr) { toast.error(titleErr); return; }
    await csrfGuard(async () => {
      const a = n as any;
      const { error } = await supabase.from("notices").update({
        title: stripHtml(n.title).trim(),
        description: n.description,
        date: n.date,
        is_active: n.is_active, is_pinned: a.is_pinned, expires_at: a.expires_at || null, publish_at: a.publish_at || null,
        seo_title: a.seo_title || null, seo_description: a.seo_description || null,
        seo_keywords: a.seo_keywords || null, seo_canonical_url: a.seo_canonical_url || null,
        seo_og_title: a.seo_og_title || null, seo_og_description: a.seo_og_description || null,
        seo_og_image: a.seo_og_image || null, seo_twitter_title: a.seo_twitter_title || null,
        seo_twitter_description: a.seo_twitter_description || null, seo_twitter_image: a.seo_twitter_image || null,
      } as any).eq("id", n.id);
      if (error) toast.error(error.message); else toast.success("Updated");
    });
  };

  const togglePin = async (n: Notice) => {
    await csrfGuard(async () => {
      const newVal = !(n as any).is_pinned;
      const { error } = await supabase.from("notices").update({ is_pinned: newVal } as any).eq("id", n.id);
      if (error) { toast.error(error.message); return; }
      setNotices(prev => prev.map(x => x.id === n.id ? ({ ...x, is_pinned: newVal } as any) : x));
      toast.success(newVal ? "Pinned" : "Unpinned");
    });
  };

  const deleteNotice = async (id: string) => {
    await csrfGuard(async () => {
      await supabase.from("notices").delete().eq("id", id);
      setNotices(prev => prev.filter(n => n.id !== id));
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      setExpandedDeleteId(null);
      toast.success("Deleted");
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    const allIds = filteredNotices.map(n => n.id);
    setSelectedIds(allIds.every(id => selectedIds.has(id)) ? new Set() : new Set(allIds));
  };
  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected notice(s)?`)) return;
    await csrfGuard(async () => {
      setBulkDeleting(true);
      for (const id of selectedIds) { await supabase.from("notices").delete().eq("id", id); }
      setNotices(prev => prev.filter(n => !selectedIds.has(n.id)));
      toast.success(`${selectedIds.size} notice(s) deleted`);
      setSelectedIds(new Set());
      setBulkDeleting(false);
    });
  };

  const updateLocal = (id: string, updates: Record<string, any>) => {
    setNotices(prev => prev.map(x => (x.id === id ? ({ ...x, ...updates } as any) : x)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = notices.findIndex(n => n.id === active.id);
    const newIndex = notices.findIndex(n => n.id === over.id);
    setNotices(arrayMove(notices, oldIndex, newIndex));
    setOrderDirty(true);
  };

  const saveOrder = useCallback(async () => {
    await csrfGuard(async () => {
      setSavingOrder(true);
      for (let i = 0; i < notices.length; i++) {
        await supabase.from("notices").update({ sort_order: i }).eq("id", notices[i].id);
      }
      setOrderDirty(false); setSavingOrder(false);
      toast.success("Order saved");
    });
  }, [notices, csrfGuard]);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4 relative">
      {/* Header */}
      <div ref={topRef} className="flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mt-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Notices <span className="text-base font-normal text-muted-foreground">({notices.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {orderDirty && (
            <>
              <span className="text-xs text-destructive flex items-center gap-1"><AlertTriangle size={12} /> Order changed</span>
              <Button size="sm" onClick={saveOrder} disabled={savingOrder} className="animate-in fade-in">
                <Save size={14} className="mr-1" /> {savingOrder ? "Saving…" : "Save Order"}
              </Button>
            </>
          )}
          <Button onClick={addNotice} size="sm"><Plus size={14} className="mr-1" /> Add Notice</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 h-9" placeholder="Search notices..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
        {searchQuery && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery("")}>
            <X size={14} />
          </button>
        )}
      </div>
      {isFiltering && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredNotices.length} of {notices.length} notices matching "{searchQuery}"
        </p>
      )}

      {/* Select All */}
      {filteredNotices.length > 0 && (
        <div className="admin-select-all">
          <Checkbox
            checked={filteredNotices.every(n => selectedIds.has(n.id))}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs text-muted-foreground">{selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}</span>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="admin-bulk-bar">
          <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={bulkDeleting}>
            <Trash2 size={14} className="mr-1" /> {bulkDeleting ? "Deleting…" : `Delete (${selectedIds.size})`}
          </Button>
        </div>
      )}

      {(() => {
        const pagedNotices = paginateItems(filteredNotices, page, pageSize);
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pagedNotices.map(n => n.id)} strategy={verticalListSortingStrategy}>
              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                {/* Desktop header */}
                <div className="hidden md:grid md:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 items-center px-4 py-2.5 admin-table-header">
                  <span className="w-10" />
                  <span>Title</span>
                  <span className="w-24">Date</span>
                  <span className="w-24">Expires</span>
                  <span className="w-16 text-center">Status</span>
                  <span className="w-16 text-center">Pin</span>
                  <span className="w-24 text-right">Actions</span>
                </div>

                {pagedNotices.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {isFiltering ? "No notices match your search." : "No notices found."}
                  </div>
                )}

                {pagedNotices.map(n => {
                  const a = n as any;
                  const isEditing = expandedEditId === n.id;
                  const isDeleting = expandedDeleteId === n.id;
                  const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
                  const contentStatus = getContentStatus({ isActive: n.is_active, publishAt: a.publish_at, expireAt: a.expires_at ? new Date(a.expires_at + "T23:59:59").toISOString() : null });

                  return (
                    <SortableRow key={n.id} id={n.id}>
                      <div className={`transition-colors ${selectedIds.has(n.id) ? "bg-primary/5" : ""} ${isExpired ? "opacity-50" : ""}`}>
                        {/* Desktop compact row */}
                        <div className="hidden md:grid md:grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-3 items-center px-3 py-3">
                          <div className="w-10">
                            <Checkbox checked={selectedIds.has(n.id)} onCheckedChange={() => toggleSelect(n.id)} />
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">{n.title}</span>
                          <span className="w-24 text-xs text-muted-foreground">{formatDate(n.date)}</span>
                          <span className="w-24 text-xs text-muted-foreground">{a.expires_at ? formatDate(a.expires_at) : "—"}</span>
                          <span className="w-16 text-center">
                            <ContentStatusBadge status={contentStatus} />
                          </span>
                          <span className="w-16 text-center">
                            {a.is_pinned ? <Pin size={14} className="text-primary fill-primary mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
                          </span>
                          <div className="w-24 flex items-center justify-end gap-1">
                            <Button size="sm" variant={isEditing ? "default" : "outline"} className="h-7 px-2 text-xs"
                              onClick={() => { setExpandedEditId(isEditing ? null : n.id); setExpandedDeleteId(null); }}>
                              <Pencil size={12} className="mr-1" /> Edit
                            </Button>
                            <Button size="sm" variant={isDeleting ? "destructive" : "outline"} className="h-7 px-2 text-xs"
                              onClick={() => { setExpandedDeleteId(isDeleting ? null : n.id); if (!isDeleting) setExpandedEditId(null); }}>
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>

                        {/* Mobile compact row */}
                        <div className="md:hidden px-3 py-3 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Checkbox checked={selectedIds.has(n.id)} onCheckedChange={() => toggleSelect(n.id)} className="shrink-0" />
                            <span className="text-sm font-medium text-foreground truncate flex-1">{n.title}</span>
                            {a.is_pinned && <Pin size={14} className="text-primary fill-primary shrink-0" />}
                          </div>
                          <div className="flex items-center justify-between pl-6">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatDate(n.date)}</span>
                              <span>•</span>
                              <span className={n.is_active ? "text-emerald-600 font-medium" : ""}>{n.is_active ? "Active" : "Inactive"}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 pl-6">
                            <Button size="sm" variant={isEditing ? "default" : "outline"} className="h-7 px-2 text-xs flex-1"
                              onClick={() => { setExpandedEditId(isEditing ? null : n.id); setExpandedDeleteId(null); }}>
                              <Pencil size={12} className="mr-1" /> Edit
                            </Button>
                            <Button size="sm" variant={isDeleting ? "destructive" : "outline"} className="h-7 px-2 text-xs flex-1"
                              onClick={() => { setExpandedDeleteId(isDeleting ? null : n.id); if (!isDeleting) setExpandedEditId(null); }}>
                              <Trash2 size={12} className="mr-1" /> Delete
                            </Button>
                          </div>
                        </div>

                        {/* Delete confirmation */}
                        {isDeleting && (
                          <div className="px-4 py-3 bg-destructive/5 border-t border-destructive/20">
                            <p className="text-sm text-foreground mb-2">Are you sure you want to delete this notice?</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setExpandedDeleteId(null)}>Cancel</Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => deleteNotice(n.id)}>
                                <Trash2 size={12} className="mr-1" /> Confirm Delete
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Edit form */}
                        {isEditing && (
                          <div className="px-4 py-4 bg-muted/20 border-t border-border space-y-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                                <Input ref={expandedEditId === n.id ? newTitleRef : undefined} value={n.title} onChange={e => updateLocal(n.id, { title: e.target.value })} placeholder="Title" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                                <Input type="date" value={n.date} onChange={e => updateLocal(n.id, { date: e.target.value })} />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                                <Textarea value={n.description || ""} onChange={e => updateLocal(n.id, { description: e.target.value })} placeholder="Description" rows={3} />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Expiry Date</label>
                                <Input type="date" value={a.expires_at || ""} onChange={e => updateLocal(n.id, { expires_at: e.target.value || null })} />
                              </div>
                              <div className="flex items-end gap-6">
                                <label className="flex items-center gap-2 text-sm cursor-pointer h-9">
                                  <Switch checked={n.is_active} onCheckedChange={v => updateLocal(n.id, { is_active: v })} />
                                  <span className={n.is_active ? "text-foreground" : "text-muted-foreground"}>Active</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm cursor-pointer h-9">
                                  <Switch checked={a.is_pinned} onCheckedChange={() => togglePin(n)} />
                                  <span className={a.is_pinned ? "text-foreground" : "text-muted-foreground"}>Pinned</span>
                                </label>
                              </div>
                            </div>
                            <SeoFieldsPanel
                              values={{
                                seo_title: a.seo_title, seo_description: a.seo_description,
                                seo_keywords: a.seo_keywords, seo_canonical_url: a.seo_canonical_url,
                                seo_og_title: a.seo_og_title, seo_og_description: a.seo_og_description,
                                seo_og_image: a.seo_og_image, seo_twitter_title: a.seo_twitter_title,
                                seo_twitter_description: a.seo_twitter_description, seo_twitter_image: a.seo_twitter_image,
                              }}
                              onChange={(field, value) => updateLocal(n.id, { [field]: value })}
                              defaultCanonical={`https://iqbalsir.bd/notices`}
                            />
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setExpandedEditId(null)}>Cancel</Button>
                              <Button size="sm" onClick={() => { updateNotice(n); setExpandedEditId(null); }}>
                                <Save size={14} className="mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </SortableRow>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        );
      })()}

      {/* Pagination */}
      <AdminPagination total={filteredNotices.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />
    </div>
  );
};

export default AdminNotices;
