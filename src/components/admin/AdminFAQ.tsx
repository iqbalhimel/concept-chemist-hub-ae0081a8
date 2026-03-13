import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCsrfGuard, useCsrfToken } from "@/hooks/useCsrfGuard";
import { Plus, Trash2, Save, GripVertical, Pencil, X } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  question_bn: string;
  answer_bn: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const SortableRow = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} className="w-full max-w-full min-w-0" {...attributes}>
      <div className="flex items-start gap-2 w-full min-w-0">
        <button {...listeners} className="mt-3 cursor-grab text-muted-foreground hover:text-foreground shrink-0"><GripVertical size={16} /></button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};

const AdminFAQ = () => {
  const csrfGuard = useCsrfGuard();
  const csrfToken = useCsrfToken();
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
  const [expandedDeleteId, setExpandedDeleteId] = useState<string | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const newIdRef = useRef<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (newIdRef.current && expandedEditId === newIdRef.current) {
      setTimeout(() => titleRef.current?.focus(), 100);
      newIdRef.current = null;
    }
  }, [expandedEditId]);

  const fetchAll = async () => {
    const { data } = await supabase.from("faq").select("*").order("sort_order");
    setItems((data as FAQItem[]) || []);
    setLoading(false);
  };

  const add = async () => {
    await csrfGuard(async () => {
      const { data, error } = await supabase.from("faq").insert({ question: "New Question?", answer: "Answer here.", question_bn: "", answer_bn: "", sort_order: 0 }).select().single();
      if (error || !data) { toast.error(error?.message || "Failed"); return; }
      toast.success("Added");
      newIdRef.current = data.id;
      setExpandedEditId(data.id);
      setItems(prev => [data as FAQItem, ...prev]);
    });
  };

  const update = async (id: string, updates: Partial<FAQItem>) => {
    await csrfGuard(async () => {
      const { error } = await supabase.from("faq").update(updates).eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Updated");
      setExpandedEditId(null);
    });
  };

  const toggleActive = async (item: FAQItem) => {
    await csrfGuard(async () => {
      const newVal = !item.is_active;
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, is_active: newVal } : x));
      const { error } = await supabase.from("faq").update({ is_active: newVal }).eq("id", item.id);
      if (error) toast.error(error.message); else toast.success(newVal ? "Activated" : "Deactivated");
    });
  };

  const remove = async (id: string) => {
    await csrfGuard(async () => {
      await supabase.from("faq").delete().eq("id", id);
      setItems(prev => prev.filter(n => n.id !== id));
      setExpandedDeleteId(null);
      toast.success("Deleted");
    });
  };

  const updateLocal = (id: string, field: string, value: string) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems(prev => {
      const oldIdx = prev.findIndex(i => i.id === active.id);
      const newIdx = prev.findIndex(i => i.id === over.id);
      const updated = [...prev];
      const [moved] = updated.splice(oldIdx, 1);
      updated.splice(newIdx, 0, moved);
      return updated.map((item, i) => ({ ...item, sort_order: i }));
    });
    setOrderChanged(true);
  }, []);

  const saveOrder = async () => {
    await csrfGuard(async () => {
      const promises = items.map((item, i) => supabase.from("faq").update({ sort_order: i }).eq("id", item.id));
      await Promise.all(promises);
      setOrderChanged(false);
      toast.success("Order saved");
    });
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4 w-full max-w-full min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl font-bold text-foreground">FAQ</h2>
        <div className="flex gap-2">
          {orderChanged && <Button onClick={saveOrder} size="sm" variant="outline"><Save size={14} className="mr-1" /> Save Order</Button>}
          <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add FAQ</Button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.length === 0 && <p className="text-muted-foreground text-sm">No FAQs added yet.</p>}
          {items.map(item => (
            <SortableRow key={item.id} id={item.id}>
              <div className="glass-card p-3 w-full max-w-full min-w-0 overflow-hidden">
                {/* Desktop */}
                <div className="hidden md:flex items-center gap-4">
                  <span className="flex-1 font-medium text-foreground truncate">{item.question}</span>
                  <div className="flex items-center gap-1 text-xs">
                    <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                    <span className={item.is_active ? "text-green-500" : "text-muted-foreground"}>{item.is_active ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setExpandedEditId(expandedEditId === item.id ? null : item.id); setExpandedDeleteId(null); }}><Pencil size={14} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => { setExpandedDeleteId(expandedDeleteId === item.id ? null : item.id); setExpandedEditId(null); }}><Trash2 size={14} /></Button>
                  </div>
                </div>
                {/* Mobile */}
                <div className="md:hidden space-y-2">
                  <p className="font-medium text-foreground text-sm truncate">{item.question}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs">
                      <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                      <span className={item.is_active ? "text-green-500" : "text-muted-foreground"}>{item.is_active ? "Active" : "Inactive"}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setExpandedEditId(expandedEditId === item.id ? null : item.id); setExpandedDeleteId(null); }}><Pencil size={14} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => { setExpandedDeleteId(expandedDeleteId === item.id ? null : item.id); setExpandedEditId(null); }}><Trash2 size={14} /></Button>
                    </div>
                  </div>
                </div>

                {/* Edit panel */}
                {expandedEditId === item.id && (
                  <div className="mt-3 pt-3 border-t border-border space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Question (English)</Label>
                      <Input ref={titleRef} value={item.question} onChange={e => updateLocal(item.id, "question", e.target.value)} placeholder="Question in English" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Answer (English)</Label>
                      <Textarea value={item.answer} onChange={e => updateLocal(item.id, "answer", e.target.value)} placeholder="Answer in English" rows={3} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">প্রশ্ন (বাংলা)</Label>
                      <Input value={item.question_bn} onChange={e => updateLocal(item.id, "question_bn", e.target.value)} placeholder="বাংলায় প্রশ্ন লিখুন" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">উত্তর (বাংলা)</Label>
                      <Textarea value={item.answer_bn} onChange={e => updateLocal(item.id, "answer_bn", e.target.value)} placeholder="বাংলায় উত্তর লিখুন" rows={3} className="mt-1" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => update(item.id, { question: item.question, answer: item.answer, question_bn: item.question_bn, answer_bn: item.answer_bn })}><Save size={14} className="mr-1" /> Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setExpandedEditId(null)}><X size={14} className="mr-1" /> Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Delete confirmation */}
                {expandedDeleteId === item.id && (
                  <div className="mt-3 pt-3 border-t border-destructive/30 space-y-2">
                    <p className="text-sm text-destructive">Are you sure you want to delete this FAQ?</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setExpandedDeleteId(null)}>Cancel</Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(item.id)}>Confirm Delete</Button>
                    </div>
                  </div>
                )}
              </div>
            </SortableRow>
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default AdminFAQ;
