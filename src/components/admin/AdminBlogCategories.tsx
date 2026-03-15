import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Save, Pencil, X, Tag, GripVertical } from "lucide-react";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import { slugify } from "@/lib/slugify";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CategoryItem {
  name: string;
  slug: string;
  color: string;
  order: number;
}

const DEFAULT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#64748b", "#a855f7",
];

/* ── Sortable Row ─────────────────────────────── */

const SortableRow = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none p-1">
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
};

/* ── Main Component ───────────────────────────── */

const AdminBlogCategories = () => {
  const csrfGuard = useCsrfGuard();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CategoryItem>({ name: "", slug: "", color: "", order: 0 });
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<CategoryItem>({ name: "", slug: "", color: "", order: 0 });
  const [orderChanged, setOrderChanged] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: settingsData } = await supabase
      .from("site_settings").select("value").eq("key", "blog_categories").maybeSingle();

    const { data: posts } = await supabase.from("blog_posts").select("category");
    const counts: Record<string, number> = {};
    (posts || []).forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
    setPostCounts(counts);

    let managed: CategoryItem[] = [];
    if (settingsData?.value && Array.isArray(settingsData.value)) {
      managed = (settingsData.value as any[]).map((c: any, i: number) => ({
        name: String(c.name || c),
        slug: c.slug || slugify(String(c.name || c)),
        color: c.color || "",
        order: c.order ?? c.sort_order ?? i,
      }));
    }

    // Merge unmanaged post categories
    const managedNames = new Set(managed.map(c => c.name));
    Object.keys(counts).sort().forEach(cat => {
      if (!managedNames.has(cat)) {
        managed.push({ name: cat, slug: slugify(cat), color: "", order: managed.length });
      }
    });

    managed.sort((a, b) => a.order - b.order);
    setCategories(managed);
    setLoading(false);
  };

  const persist = async (updated: CategoryItem[]) => {
    const payload = updated.map((c, i) => ({ name: c.name, slug: c.slug, color: c.color, order: i }));
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "blog_categories", value: payload as any }, { onConflict: "key" });
    if (error) { toast.error("Failed to save categories"); return false; }
    return true;
  };

  const ensureUniqueSlug = (slug: string, excludeIdx?: number): string => {
    const existing = new Set(categories.filter((_, i) => i !== excludeIdx).map(c => c.slug));
    let result = slug;
    let n = 2;
    while (existing.has(result)) { result = `${slug}-${n++}`; }
    return result;
  };

  const handleAdd = async () => {
    const name = newForm.name.trim();
    if (!name) { toast.error("Category name is required"); return; }
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Category already exists"); return;
    }
    const slug = ensureUniqueSlug(newForm.slug || slugify(name));
    await csrfGuard(async () => {
      const item: CategoryItem = { name, slug, color: newForm.color, order: categories.length };
      const updated = [...categories, item];
      if (await persist(updated)) {
        setCategories(updated);
        setNewForm({ name: "", slug: "", color: "", order: 0 });
        setAdding(false);
        toast.success("Category added");
      }
    });
  };

  const handleRename = async (idx: number) => {
    const name = editForm.name.trim();
    if (!name) { toast.error("Name cannot be empty"); return; }
    const oldName = categories[idx].name;
    if (categories.some((c, i) => i !== idx && c.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Category already exists"); return;
    }
    const slug = ensureUniqueSlug(editForm.slug || slugify(name), idx);
    await csrfGuard(async () => {
      const updated = categories.map((c, i) => i === idx ? { ...c, name, slug, color: editForm.color } : c);
      if (await persist(updated)) {
        if (oldName !== name) {
          const count = postCounts[oldName] || 0;
          if (count > 0) {
            await supabase.from("blog_posts").update({ category: name } as any).eq("category", oldName);
          }
        }
        setCategories(updated);
        setEditingIdx(null);
        toast.success("Category updated");
        loadData();
      }
    });
  };

  const handleDelete = async (idx: number) => {
    const cat = categories[idx];
    const count = postCounts[cat.name] || 0;
    if (count > 0) {
      if (!window.confirm(`"${cat.name}" is used by ${count} post(s). Posts will keep this category value but it will no longer appear in the managed list. Continue?`)) return;
    } else {
      if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    }
    await csrfGuard(async () => {
      const updated = categories.filter((_, i) => i !== idx).map((c, i) => ({ ...c, order: i }));
      if (await persist(updated)) { setCategories(updated); toast.success("Category deleted"); }
    });
  };

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = categories.findIndex(c => c.name === active.id);
    const newIdx = categories.findIndex(c => c.name === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(categories, oldIdx, newIdx).map((c, i) => ({ ...c, order: i }));
    setCategories(reordered);
    setOrderChanged(true);
  }, [categories]);

  const saveOrder = async () => {
    await csrfGuard(async () => {
      if (await persist(categories)) {
        setOrderChanged(false);
        toast.success("Order saved");
      }
    });
  };

  const ColorSwatch = ({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-6 h-6 rounded-full border-2 transition-all ${selected ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
      style={{ backgroundColor: color }}
    />
  );

  if (loading) return <div className="text-muted-foreground text-sm p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="admin-section-header">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Blog Categories</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <div className="flex items-center gap-2">
          {orderChanged && (
            <Button size="sm" variant="outline" onClick={saveOrder}>
              <Save size={14} className="mr-1" /> Save Order
            </Button>
          )}
          <Button size="sm" onClick={() => { setAdding(true); setNewForm({ name: "", slug: "", color: "", order: 0 }); }}>
            <Plus size={14} className="mr-1" /> Add Category
          </Button>
        </div>
      </div>

      {/* Add Form */}
      {adding && (
        <div className="admin-card p-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground text-sm">New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <Input
                value={newForm.name}
                onChange={e => setNewForm(f => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))}
                placeholder="e.g. Chemistry"
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
              <Input
                value={newForm.slug}
                onChange={e => setNewForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                placeholder="auto-generated"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Color (optional)</label>
            <div className="flex flex-wrap gap-2 items-center">
              {DEFAULT_COLORS.map(c => (
                <ColorSwatch key={c} color={c} selected={newForm.color === c} onClick={() => setNewForm(f => ({ ...f, color: f.color === c ? "" : c }))} />
              ))}
              <Input
                type="color"
                value={newForm.color || "#6366f1"}
                onChange={e => setNewForm(f => ({ ...f, color: e.target.value }))}
                className="w-8 h-8 p-0.5 border rounded cursor-pointer"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}><Save size={14} className="mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X size={14} className="mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {/* Table Header */}
      {categories.length > 0 && (
        <div className="hidden sm:grid sm:grid-cols-[auto_1fr_120px_80px_80px_auto] gap-3 items-center px-4 py-2 admin-table-header rounded-t-lg">
          <span className="w-6" />
          <span>Name</span>
          <span>Slug</span>
          <span>Color</span>
          <span className="text-right">Posts</span>
          <span className="text-right">Actions</span>
        </div>
      )}

      {/* Category List */}
      {categories.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <Tag size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No categories yet. Add one to get started.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map(c => c.name)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {categories.map((cat, idx) => {
                const count = postCounts[cat.name] || 0;
                const isEditing = editingIdx === idx;

                return (
                  <SortableRow key={cat.name} id={cat.name}>
                    <div className={`admin-row px-3 py-2.5 ${isEditing ? "ring-1 ring-primary/30" : ""}`}>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                              <Input
                                value={editForm.name}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                className="h-8"
                                onKeyDown={e => { if (e.key === "Enter") handleRename(idx); if (e.key === "Escape") setEditingIdx(null); }}
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Slug</label>
                              <Input
                                value={editForm.slug}
                                onChange={e => setEditForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                                className="h-8"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Color</label>
                            <div className="flex flex-wrap gap-2 items-center">
                              {DEFAULT_COLORS.map(c => (
                                <ColorSwatch key={c} color={c} selected={editForm.color === c} onClick={() => setEditForm(f => ({ ...f, color: f.color === c ? "" : c }))} />
                              ))}
                              <Input
                                type="color"
                                value={editForm.color || "#6366f1"}
                                onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))}
                                className="w-8 h-8 p-0.5 border rounded cursor-pointer"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="h-7" onClick={() => handleRename(idx)}><Save size={12} className="mr-1" /> Save</Button>
                            <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditingIdx(null)}><X size={12} className="mr-1" /> Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Desktop */}
                          <div className="hidden sm:grid sm:grid-cols-[1fr_120px_80px_80px_auto] gap-3 items-center">
                            <div className="flex items-center gap-2 min-w-0">
                              {cat.color ? (
                                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                              ) : (
                                <Tag size={13} className="text-muted-foreground shrink-0" />
                              )}
                              <span className="font-medium text-foreground text-sm truncate">{cat.name}</span>
                              {count > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">In use</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground font-mono truncate">{cat.slug}</span>
                            <div className="flex items-center justify-center">
                              {cat.color ? (
                                <span className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: cat.color }}>
                                  {cat.name}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground/50">—</span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground text-right tabular-nums">{count}</span>
                            <div className="flex items-center gap-1 justify-end">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingIdx(idx); setEditForm({ ...cat }); }}>
                                <Pencil size={13} />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(idx)}>
                                <Trash2 size={13} />
                              </Button>
                            </div>
                          </div>

                          {/* Mobile */}
                          <div className="sm:hidden space-y-1.5">
                            <div className="flex items-center gap-2">
                              {cat.color ? (
                                <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                              ) : (
                                <Tag size={13} className="text-muted-foreground shrink-0" />
                              )}
                              <span className="font-medium text-foreground text-sm flex-1 min-w-0 truncate">{cat.name}</span>
                              <span className="text-xs text-muted-foreground tabular-nums shrink-0">{count} posts</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground font-mono">/{cat.slug}</span>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingIdx(idx); setEditForm({ ...cat }); }}>
                                  <Pencil size={13} />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(idx)}>
                                  <Trash2 size={13} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </SortableRow>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default AdminBlogCategories;
