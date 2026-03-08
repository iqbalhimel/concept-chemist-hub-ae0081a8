import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Material = Tables<"study_materials">;

const AdminStudyMaterials = () => {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("study_materials").select("*").order("sort_order");
    setItems(data || []);
    setLoading(false);
  };

  const add = async () => {
    const { error } = await supabase.from("study_materials").insert({ title: "New Material", category: "Physics" });
    if (error) { toast.error(error.message); return; }
    toast.success("Added");
    fetch();
  };

  const update = async (id: string, updates: Partial<Material>) => {
    const { error } = await supabase.from("study_materials").update(updates).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Updated");
  };

  const remove = async (id: string) => {
    await supabase.from("study_materials").delete().eq("id", id);
    setItems(prev => prev.filter(n => n.id !== id));
    toast.success("Deleted");
  };

  const updateLocal = (id: string, field: string, value: string | number | null) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Study Materials</h2>
        <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add</Button>
      </div>
      {items.map(item => (
        <div key={item.id} className="glass-card p-4 grid gap-2 sm:grid-cols-2">
          <Input value={item.title} onChange={e => updateLocal(item.id, "title", e.target.value)} placeholder="Title" />
          <Input value={item.category} onChange={e => updateLocal(item.id, "category", e.target.value)} placeholder="Category" />
          <Input value={item.file_url || ""} onChange={e => updateLocal(item.id, "file_url", e.target.value)} placeholder="File URL" />
          <Input value={item.file_size || ""} onChange={e => updateLocal(item.id, "file_size", e.target.value)} placeholder="File Size (e.g. 2.4 MB)" />
          <Input type="number" value={item.pages || ""} onChange={e => updateLocal(item.id, "pages", e.target.value ? parseInt(e.target.value) : null)} placeholder="Pages" />
          <div className="flex gap-2 items-end">
            <Button size="sm" onClick={() => update(item.id, { title: item.title, category: item.category, file_url: item.file_url, file_size: item.file_size, pages: item.pages })}><Save size={14} className="mr-1" /> Save</Button>
            <Button size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 size={14} /></Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStudyMaterials;
