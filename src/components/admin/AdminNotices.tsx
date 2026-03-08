import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Notice = Tables<"notices">;

const AdminNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    const { data } = await supabase.from("notices").select("*").order("sort_order");
    setNotices(data || []);
    setLoading(false);
  };

  const addNotice = async () => {
    const { error } = await supabase.from("notices").insert({ title: "New Notice", description: "", date: new Date().toISOString().split("T")[0] });
    if (error) { toast.error(error.message); return; }
    toast.success("Notice added");
    fetchNotices();
  };

  const updateNotice = async (id: string, updates: Partial<Notice>) => {
    const { error } = await supabase.from("notices").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Updated");
  };

  const deleteNotice = async (id: string) => {
    await supabase.from("notices").delete().eq("id", id);
    setNotices(prev => prev.filter(n => n.id !== id));
    toast.success("Deleted");
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Notices</h2>
        <Button onClick={addNotice} size="sm"><Plus size={14} className="mr-1" /> Add Notice</Button>
      </div>
      {notices.map(n => (
        <div key={n.id} className="glass-card p-4 space-y-2">
          <Input value={n.title} onChange={e => { setNotices(prev => prev.map(x => x.id === n.id ? { ...x, title: e.target.value } : x)); }} placeholder="Title" />
          <Textarea value={n.description || ""} onChange={e => { setNotices(prev => prev.map(x => x.id === n.id ? { ...x, description: e.target.value } : x)); }} placeholder="Description" />
          <Input type="date" value={n.date} onChange={e => { setNotices(prev => prev.map(x => x.id === n.id ? { ...x, date: e.target.value } : x)); }} />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateNotice(n.id, { title: n.title, description: n.description, date: n.date })}><Save size={14} className="mr-1" /> Save</Button>
            <Button size="sm" variant="destructive" onClick={() => deleteNotice(n.id)}><Trash2 size={14} /></Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminNotices;
