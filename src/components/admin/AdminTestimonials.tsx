import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical, Pencil, Star, X, MessageSquareQuote, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useCsrfGuard, useCsrfToken } from "@/hooks/useCsrfGuard";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Testimonial {
  id: string;
  student_name: string;
  student_info: string;
  testimonial_text_en: string;
  testimonial_text_bn: string;
  rating: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

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

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(s => (
      <button key={s} type="button" onClick={() => onChange(s)} className="p-0.5">
        <Star size={18} className={s <= value ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"} />
      </button>
    ))}
  </div>
);

const AdminTestimonials = () => {
  const csrfGuard = useCsrfGuard();
  const csrfToken = useCsrfToken();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [orderDirty, setOrderDirty] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [form, setForm] = useState({
    student_name: "",
    student_info: "",
    testimonial_text_en: "",
    testimonial_text_bn: "",
    rating: 5,
    sort_order: 0,
    is_active: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Failed to load testimonials");
    else setItems((data as Testimonial[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i =>
      i.student_name.toLowerCase().includes(q) ||
      i.student_info.toLowerCase().includes(q) ||
      i.testimonial_text_en.toLowerCase().includes(q) ||
      i.testimonial_text_bn.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const isFiltering = searchQuery.trim() !== "";

  const resetForm = () => {
    setForm({ student_name: "", student_info: "", testimonial_text_en: "", testimonial_text_bn: "", rating: 5, sort_order: items.length, is_active: true });
    setEditId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.student_name.trim()) { toast.error("Student name is required"); return; }
    if (!form.testimonial_text_en.trim() && !form.testimonial_text_bn.trim()) { toast.error("At least one testimonial text is required"); return; }

    await csrfGuard(async () => {
      if (editId) {
        const { error } = await supabase.from("testimonials").update(form).eq("id", editId);
        if (error) toast.error("Update failed");
        else { toast.success("Testimonial updated"); resetForm(); fetchItems(); }
      } else {
        const { error } = await supabase.from("testimonials").insert({ ...form, sort_order: items.length });
        if (error) toast.error("Insert failed");
        else { toast.success("Testimonial added"); resetForm(); fetchItems(); }
      }
    });
  };

  const handleEdit = (item: Testimonial) => {
    setForm({
      student_name: item.student_name,
      student_info: item.student_info,
      testimonial_text_en: item.testimonial_text_en,
      testimonial_text_bn: item.testimonial_text_bn,
      rating: item.rating,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setEditId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;
    await csrfGuard(async () => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) toast.error("Delete failed");
      else { toast.success("Deleted"); if (editId === id) resetForm(); fetchItems(); }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex(i => i.id === active.id);
    const newIdx = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIdx, newIdx).map((item, idx) => ({ ...item, sort_order: idx }));
    setItems(reordered);
    setOrderDirty(true);
  };

  const saveOrder = async () => {
    await csrfGuard(async () => {
      const updates = items.map((item, idx) =>
        supabase.from("testimonials").update({ sort_order: idx }).eq("id", item.id)
      );
      await Promise.all(updates);
      setOrderDirty(false);
      toast.success("Order saved");
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    const allIds = filteredItems.map(i => i.id);
    setSelectedIds(allIds.every(id => selectedIds.has(id)) ? new Set() : new Set(allIds));
  };
  const bulkDeleteItems = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected testimonial(s)?`)) return;
    await csrfGuard(async () => {
      setBulkDeleting(true);
      await Promise.all([...selectedIds].map(id => supabase.from("testimonials").delete().eq("id", id)));
      setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
      if (editId && selectedIds.has(editId)) resetForm();
      toast.success(`${selectedIds.size} testimonial(s) deleted`);
      setSelectedIds(new Set());
      setBulkDeleting(false);
    });
  };

  const paginated = paginateItems(filteredItems, page, pageSize);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mt-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Testimonials <span className="text-base font-normal text-muted-foreground">({items.length})</span>
        </h2>
        <div className="flex gap-2 flex-wrap">
          {orderDirty && (
            <Button onClick={saveOrder} variant="outline" size="sm">
              <Save size={14} className="mr-1" /> Save Order
            </Button>
          )}
          <Button onClick={() => { resetForm(); setShowForm(true); setForm(f => ({ ...f, sort_order: items.length })); }} size="sm">
            <Plus size={14} className="mr-1" /> Add Testimonial
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 h-9" placeholder="Search testimonials..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
        {searchQuery && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery("")}>
            <X size={14} />
          </button>
        )}
      </div>
      {isFiltering && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredItems.length} of {items.length} testimonials matching "{searchQuery}"
        </p>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="border border-border rounded-lg p-5 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">{editId ? "Edit Testimonial" : "Add Testimonial"}</h3>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Student Name *</Label>
              <Input className="mt-1" value={form.student_name} onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))} placeholder="e.g. Rafiq Ahmed" />
            </div>
            <div>
              <Label>Student Info</Label>
              <Input className="mt-1" value={form.student_info} onChange={e => setForm(f => ({ ...f, student_info: e.target.value }))} placeholder="e.g. SSC 2024 · GPA 5.00" />
            </div>
          </div>
          <div>
            <Label>Testimonial (English)</Label>
            <Textarea className="mt-1" rows={3} value={form.testimonial_text_en} onChange={e => setForm(f => ({ ...f, testimonial_text_en: e.target.value }))} placeholder="Testimonial text in English..." />
          </div>
          <div>
            <Label>Testimonial (বাংলা)</Label>
            <Textarea className="mt-1" rows={3} value={form.testimonial_text_bn} onChange={e => setForm(f => ({ ...f, testimonial_text_bn: e.target.value }))} placeholder="বাংলায় মতামত লিখুন..." />
          </div>
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div>
              <Label>Rating</Label>
              <div className="mt-1.5">
                <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
              </div>
            </div>
            <div>
              <Label>Sort Order</Label>
              <Input type="number" className="mt-1" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <input type="hidden" name="_csrf" value={csrfToken || ""} />
            <Button onClick={handleSave} size="sm"><Save size={14} className="mr-1" /> Save</Button>
            <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <MessageSquareQuote size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{isFiltering ? "No testimonials match your search." : "No testimonials added yet."}</p>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div className="admin-select-all">
            <Checkbox
              checked={filteredItems.every(i => selectedIds.has(i.id))}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-xs text-muted-foreground">{selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}</span>
          </div>

          {selectedIds.size > 0 && (
            <div className="admin-bulk-bar">
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              <Button size="sm" variant="destructive" onClick={bulkDeleteItems} disabled={bulkDeleting} className="animate-in fade-in">
                <Trash2 size={14} className="mr-1" /> {bulkDeleting ? "Deleting…" : `Delete (${selectedIds.size})`}
              </Button>
            </div>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={paginated.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {paginated.map(item => (
                  <SortableRow key={item.id} id={item.id}>
                    <div className={`admin-row p-4 ${editId === item.id ? "selected border-primary" : selectedIds.has(item.id) ? "selected" : ""}`}>
                      {/* Desktop */}
                      <div className="hidden md:flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground text-sm">{item.student_name}</span>
                              <span className="text-xs text-muted-foreground">{item.student_info}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.is_active ? "bg-green-500/15 text-green-500" : "bg-muted text-muted-foreground"}`}>
                                {item.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, s) => (
                                <Star key={s} size={12} className={s < item.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"} />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.testimonial_text_en || item.testimonial_text_bn}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(item)}>
                            <Pencil size={14} />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>

                      {/* Mobile */}
                      <div className="md:hidden space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-foreground text-sm">{item.student_name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.is_active ? "bg-green-500/15 text-green-500" : "bg-muted text-muted-foreground"}`}>
                                {item.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pl-6">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star key={s} size={10} className={s < item.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/20"} />
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                              <Pencil size={12} />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </SortableRow>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="admin-pagination-footer pt-4">
            <AdminPagination
              page={page}
              pageSize={pageSize}
              total={filteredItems.length}
              onPageChange={setPage}
              onPageSizeChange={(v) => { setPageSize(v); setPage(1); }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTestimonials;
