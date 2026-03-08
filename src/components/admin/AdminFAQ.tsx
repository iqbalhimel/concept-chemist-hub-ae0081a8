import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type FAQItem = Tables<"faq">;

const AdminFAQ = () => {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("faq").select("*").order("sort_order");
    setItems(data || []);
    setLoading(false);
  };

  const add = async () => {
    const { error } = await supabase.from("faq").insert({ question: "New Question?", answer: "Answer here." });
    if (error) { toast.error(error.message); return; }
    toast.success("Added");
    fetchAll();
  };

  const update = async (id: string, updates: Partial<FAQItem>) => {
    const { error } = await supabase.from("faq").update(updates).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Updated");
  };

  const remove = async (id: string) => {
    await supabase.from("faq").delete().eq("id", id);
    setItems(prev => prev.filter(n => n.id !== id));
    toast.success("Deleted");
  };

  const updateLocal = (id: string, field: string, value: string) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">FAQ</h2>
        <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add FAQ</Button>
      </div>
      {items.map(item => (
        <div key={item.id} className="glass-card p-4 space-y-2">
          <Input value={item.question} onChange={e => updateLocal(item.id, "question", e.target.value)} placeholder="Question" />
          <Textarea value={item.answer} onChange={e => updateLocal(item.id, "answer", e.target.value)} placeholder="Answer" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => update(item.id, { question: item.question, answer: item.answer })}><Save size={14} className="mr-1" /> Save</Button>
            <Button size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 size={14} /></Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminFAQ;
