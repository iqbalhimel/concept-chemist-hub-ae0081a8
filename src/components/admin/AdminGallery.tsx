import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type GalleryItem = Tables<"gallery">;

const AdminGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("gallery").select("*").order("sort_order");
    setItems(data || []);
    setLoading(false);
  };

  const add = async () => {
    const { error } = await supabase.from("gallery").insert({ image_url: "", label: "New Image" });
    if (error) { toast.error(error.message); return; }
    toast.success("Added");
    fetchAll();
  };

  const update = async (id: string, updates: Partial<GalleryItem>) => {
    const { error } = await supabase.from("gallery").update(updates).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Updated");
  };

  const remove = async (id: string) => {
    await supabase.from("gallery").delete().eq("id", id);
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
        <h2 className="font-display text-2xl font-bold text-foreground">Gallery</h2>
        <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add Image</Button>
      </div>
      {items.map(item => (
        <div key={item.id} className="glass-card p-4 flex gap-4 items-start">
          {item.image_url && <img src={item.image_url} alt={item.alt || ""} className="w-20 h-20 rounded-lg object-cover bg-muted" />}
          <div className="flex-1 space-y-2">
            <Input value={item.image_url} onChange={e => updateLocal(item.id, "image_url", e.target.value)} placeholder="Image URL" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={item.label || ""} onChange={e => updateLocal(item.id, "label", e.target.value)} placeholder="Label" />
              <Input value={item.alt || ""} onChange={e => updateLocal(item.id, "alt", e.target.value)} placeholder="Alt text" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => update(item.id, { image_url: item.image_url, label: item.label, alt: item.alt })}><Save size={14} className="mr-1" /> Save</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminGallery;
