import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { Plus, GripVertical, Pencil, Trash2, Save } from "lucide-react";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import AdminPagination, { paginateItems } from "./AdminPagination";

interface Training {
  id: string;
  title_en: string;
  title_bn: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

const empty: Omit<Training, "id"> = { title_en: "", title_bn: "", icon: "Award", is_active: true, sort_order: 0 };
const iconOptions = ["Award", "FlaskConical", "Monitor", "Lightbulb", "BookOpen", "GraduationCap"];

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} {...attributes}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 glass-card p-4 min-w-0">
        <button {...listeners} className="cursor-grab shrink-0"><GripVertical size={18} className="text-muted-foreground" /></button>
        {children}
      </div>
    </div>
  );
}

const AdminProfessionalTraining = () => {
  const [items, setItems] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [orderChanged, setOrderChanged] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from("professional_training").select("*").order("sort_order");
    setItems((data as Training[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSave = async () => {
    if (!form.title_en.trim()) { toast.error("English title is required"); return; }
    if (editing) {
      await supabase.from("professional_training").update(form).eq("id", editing);
      toast.success("Updated");
    } else {
      await supabase.from("professional_training").insert({ ...form, sort_order: items.length });
      toast.success("Added");
    }
    setEditing(null);
    setForm(empty);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("professional_training").delete().eq("id", id);
    toast.success("Deleted");
    fetchAll();
  };

  const toggleActive = async (id: string, val: boolean) => {
    await supabase.from("professional_training").update({ is_active: val }).eq("id", id);
    fetchAll();
  };

  const startEdit = (item: Training) => {
    setEditing(item.id);
    setForm({ title_en: item.title_en, title_bn: item.title_bn, icon: item.icon, is_active: item.is_active, sort_order: item.sort_order });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems(prev => {
      const oi = prev.findIndex(i => i.id === active.id);
      const ni = prev.findIndex(i => i.id === over.id);
      return arrayMove(prev, oi, ni);
    });
    setOrderChanged(true);
  };

  const saveOrder = async () => {
    await Promise.all(items.map((it, i) => supabase.from("professional_training").update({ sort_order: i }).eq("id", it.id)));
    setOrderChanged(false);
    toast.success("Order saved");
  };

  const paged = paginateItems(items, page, pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-bold">Professional Training</h3>
        <div className="flex gap-2">
          {orderChanged && <Button size="sm" onClick={saveOrder}><Save size={14} className="mr-1" /> Save Order</Button>}
          <Button size="sm" onClick={() => { setEditing(null); setForm(empty); }}><Plus size={14} className="mr-1" /> Add</Button>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Title (English)</Label><Input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} /></div>
          <div><Label>Title (Bangla)</Label><Input value={form.title_bn} onChange={e => setForm(f => ({ ...f, title_bn: e.target.value }))} /></div>
          <div>
            <Label>Icon</Label>
            <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{iconOptions.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleSave}>{editing ? "Update" : "Add"} Training</Button>
        {editing && <Button variant="ghost" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</Button>}
      </div>

      {/* List */}
      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={paged.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {paged.map(item => (
                <SortableRow key={item.id} id={item.id}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.title_en}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.title_bn}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={item.is_active} onCheckedChange={v => toggleActive(item.id, v)} />
                    <Button variant="ghost" size="icon" onClick={() => startEdit(item)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
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

export default AdminProfessionalTraining;
