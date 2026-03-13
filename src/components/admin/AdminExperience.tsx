import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical, Pencil, X } from "lucide-react";
import { useCsrfGuard, useCsrfToken } from "@/hooks/useCsrfGuard";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Experience {
  id: string; job_title_en: string; job_title_bn: string; institution_en: string; institution_bn: string;
  duration_en: string; duration_bn: string; description_en: string; description_bn: string;
  sort_order: number; is_active: boolean;
}

const empty: Omit<Experience, "id"> = {
  job_title_en: "", job_title_bn: "", institution_en: "", institution_bn: "",
  duration_en: "", duration_bn: "", description_en: "", description_bn: "",
  sort_order: 0, is_active: true,
};

const SortableRow = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div className="flex items-start">
        <button {...attributes} {...listeners} className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none pt-3.5 pl-3 pr-1"><GripVertical size={16} /></button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};

const AdminExperience = () => {
  const csrfGuard = useCsrfGuard();
  const csrfToken = useCsrfToken();
  const [items, setItems] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [adding, setAdding] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => { const { data } = await supabase.from("experience").select("*").order("sort_order"); setItems((data as Experience[]) || []); setLoading(false); };

  const handleSave = async () => {
    if (!form.job_title_en.trim() && !form.job_title_bn.trim()) { toast.error("Job title (EN or BN) is required"); return; }
    await csrfGuard(async () => {
      if (editing) {
        const { error } = await supabase.from("experience").update(form).eq("id", editing);
        if (error) { toast.error(error.message); return; }
        toast.success("Updated!");
      } else {
        const { error } = await supabase.from("experience").insert({ ...form, sort_order: items.length });
        if (error) { toast.error(error.message); return; }
        toast.success("Added!");
      }
      setEditing(null); setAdding(false); setForm(empty); fetchAll();
    });
  };

  const handleDelete = async (id: string) => { await csrfGuard(async () => { const { error } = await supabase.from("experience").delete().eq("id", id); if (error) { toast.error(error.message); return; } toast.success("Deleted!"); fetchAll(); }); };
  const toggleActive = async (id: string, val: boolean) => { await csrfGuard(async () => { await supabase.from("experience").update({ is_active: val }).eq("id", id); setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: val } : i)); }); };
  const startEdit = (item: Experience) => { setEditing(item.id); setForm({ job_title_en: item.job_title_en, job_title_bn: item.job_title_bn, institution_en: item.institution_en, institution_bn: item.institution_bn, duration_en: item.duration_en, duration_bn: item.duration_bn, description_en: item.description_en, description_bn: item.description_bn, sort_order: item.sort_order, is_active: item.is_active }); setAdding(false); };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems(prev => { const o = prev.findIndex(i => i.id === active.id); const n = prev.findIndex(i => i.id === over.id); return arrayMove(prev, o, n); });
    setOrderChanged(true);
  };
  const saveOrder = async () => { await csrfGuard(async () => { await Promise.all(items.map((item, i) => supabase.from("experience").update({ sort_order: i }).eq("id", item.id))); setOrderChanged(false); toast.success("Order saved!"); }); };

  const paginated = paginateItems(items, page, pageSize);
  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Experience</h2>
        <div className="flex gap-2">
          {orderChanged && <Button size="sm" onClick={saveOrder}><Save size={14} className="mr-1" />Save Order</Button>}
          <Button size="sm" onClick={() => { setAdding(true); setEditing(null); setForm(empty); }}><Plus size={14} className="mr-1" />Add Experience</Button>
        </div>
      </div>

      {(adding || editing) && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-foreground">{editing ? "Edit" : "Add"} Experience</h3>
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setEditing(null); }}><X size={16} /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Job Title (EN)</Label><Input value={form.job_title_en} onChange={e => setForm({ ...form, job_title_en: e.target.value })} className="mt-1" /></div>
            <div><Label>Job Title (BN)</Label><Input value={form.job_title_bn} onChange={e => setForm({ ...form, job_title_bn: e.target.value })} className="mt-1" /></div>
            <div><Label>Institution (EN)</Label><Input value={form.institution_en} onChange={e => setForm({ ...form, institution_en: e.target.value })} className="mt-1" /></div>
            <div><Label>Institution (BN)</Label><Input value={form.institution_bn} onChange={e => setForm({ ...form, institution_bn: e.target.value })} className="mt-1" /></div>
            <div><Label>Duration (EN)</Label><Input value={form.duration_en} onChange={e => setForm({ ...form, duration_en: e.target.value })} className="mt-1" placeholder="2021 – Present" /></div>
            <div><Label>Duration (BN)</Label><Input value={form.duration_bn} onChange={e => setForm({ ...form, duration_bn: e.target.value })} className="mt-1" placeholder="২০২১ – বর্তমান" /></div>
            <div className="md:col-span-2"><Label>Description (EN)</Label><Textarea value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} className="mt-1" /></div>
            <div className="md:col-span-2"><Label>Description (BN)</Label><Textarea value={form.description_bn} onChange={e => setForm({ ...form, description_bn: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
          <Button onClick={handleSave}><Save size={14} className="mr-1" />Save</Button>
        </div>
      )}

      {items.length === 0 ? <p className="text-muted-foreground text-center py-8">No experience items added yet.</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={paginated.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {paginated.map(item => (
                <SortableRow key={item.id} id={item.id}>
                  <div className="glass-card p-2.5 sm:p-4 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="font-medium text-foreground truncate text-sm sm:text-base">{item.job_title_en || "Untitled"}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.institution_en} · {item.duration_en}</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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

export default AdminExperience;
