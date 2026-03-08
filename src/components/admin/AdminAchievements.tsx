import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical, Pencil, X } from "lucide-react";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Achievement { id: string; title_en: string; title_bn: string; value: string; icon: string; sort_order: number; is_active: boolean; }
const empty: Omit<Achievement, "id"> = { title_en: "", title_bn: "", value: "", icon: "Trophy", sort_order: 0, is_active: true };

const iconOptions = ["Trophy", "Clock", "Users", "GraduationCap", "Star", "Award", "Target", "BookOpen"];

const SortableCard = ({ item, toggleActive, startEdit, handleDelete }: {
  item: Achievement; toggleActive: (id: string, v: boolean) => void; startEdit: (item: Achievement) => void; handleDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="w-full overflow-hidden">
      <div className="glass-card p-2.5 sm:p-4">
        {/* Desktop: single row. Mobile: stacked */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"><GripVertical size={16} /></button>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{item.value} — {item.title_en || "Untitled"}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Switch checked={item.is_active} onCheckedChange={v => toggleActive(item.id, v)} />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(item)}><Pencil size={14} /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
          </div>
        </div>
        <div className="flex sm:hidden flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none"><GripVertical size={16} /></button>
            <p className="font-medium text-foreground text-sm truncate min-w-0 flex-1">{item.value} — {item.title_en || "Untitled"}</p>
          </div>
          <div className="flex items-center gap-1.5 self-end">
            <Switch checked={item.is_active} onCheckedChange={v => toggleActive(item.id, v)} />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(item)}><Pencil size={14} /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminAchievements = () => {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [adding, setAdding] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => { const { data } = await supabase.from("achievements").select("*").order("sort_order"); setItems((data as Achievement[]) || []); setLoading(false); };

  const handleSave = async () => {
    if (!form.title_en.trim() || !form.value.trim()) { toast.error("Title and value are required"); return; }
    if (editing) { const { error } = await supabase.from("achievements").update(form).eq("id", editing); if (error) { toast.error(error.message); return; } toast.success("Updated!"); }
    else { const { error } = await supabase.from("achievements").insert({ ...form, sort_order: items.length }); if (error) { toast.error(error.message); return; } toast.success("Added!"); }
    setEditing(null); setAdding(false); setForm(empty); fetchAll();
  };

  const handleDelete = async (id: string) => { await supabase.from("achievements").delete().eq("id", id); toast.success("Deleted!"); fetchAll(); };
  const toggleActive = async (id: string, val: boolean) => { await supabase.from("achievements").update({ is_active: val }).eq("id", id); setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: val } : i)); };
  const startEdit = (item: Achievement) => { setEditing(item.id); setForm({ title_en: item.title_en, title_bn: item.title_bn, value: item.value, icon: item.icon, sort_order: item.sort_order, is_active: item.is_active }); setAdding(false); };

  const handleDragEnd = (event: DragEndEvent) => { const { active, over } = event; if (!over || active.id === over.id) return; setItems(prev => arrayMove(prev, prev.findIndex(i => i.id === active.id), prev.findIndex(i => i.id === over.id))); setOrderChanged(true); };
  const saveOrder = async () => { await Promise.all(items.map((item, i) => supabase.from("achievements").update({ sort_order: i }).eq("id", item.id))); setOrderChanged(false); toast.success("Order saved!"); };

  const paginated = paginateItems(items, page, pageSize);
  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Achievements / Stats</h2>
        <div className="flex gap-2">
          {orderChanged && <Button size="sm" onClick={saveOrder}><Save size={14} className="mr-1" />Save Order</Button>}
          <Button size="sm" onClick={() => { setAdding(true); setEditing(null); setForm(empty); }}><Plus size={14} className="mr-1" />Add Stat</Button>
        </div>
      </div>

      {(adding || editing) && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{editing ? "Edit" : "Add"} Achievement</h3>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setEditing(null); }}><X size={16} /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Title (EN)</Label><Input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="mt-1" placeholder="Years of Teaching Experience" /></div>
            <div><Label>Title (BN)</Label><Input value={form.title_bn} onChange={e => setForm({ ...form, title_bn: e.target.value })} className="mt-1" placeholder="বছরের শিক্ষকতার অভিজ্ঞতা" /></div>
            <div><Label>Value</Label><Input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="mt-1" placeholder="10+" /></div>
            <div>
              <Label>Icon</Label>
              <select value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {iconOptions.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
          <Button onClick={handleSave}><Save size={14} className="mr-1" />Save</Button>
        </div>
      )}

      {items.length === 0 ? <p className="text-muted-foreground text-center py-8">No achievements added yet.</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={paginated.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 w-full max-w-full overflow-hidden">
              {paginated.map(item => (
                <SortableRow key={item.id} id={item.id}>
                  <div className="glass-card p-2.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium text-foreground truncate text-sm sm:text-base">{item.value} — {item.title_en || "Untitled"}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Switch checked={item.is_active} onCheckedChange={v => toggleActive(item.id, v)} />
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => startEdit(item)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                </SortableRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <AdminPagination total={items.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
};

export default AdminAchievements;
