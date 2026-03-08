import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"blog_posts">;

const AdminBlogPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const add = async () => {
    const { error } = await supabase.from("blog_posts").insert({ title: "New Post", category: "General", excerpt: "", content: "" });
    if (error) { toast.error(error.message); return; }
    toast.success("Added");
    fetchAll();
  };

  const update = async (id: string, updates: Partial<Post>) => {
    const { error } = await supabase.from("blog_posts").update(updates).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Updated");
  };

  const remove = async (id: string) => {
    await supabase.from("blog_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success("Deleted");
  };

  const updateLocal = (id: string, field: string, value: string | boolean) => {
    setPosts(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Blog Posts</h2>
        <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add Post</Button>
      </div>
      {posts.map(post => (
        <div key={post.id} className="glass-card p-4 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={post.title} onChange={e => updateLocal(post.id, "title", e.target.value)} placeholder="Title" />
            <Input value={post.category} onChange={e => updateLocal(post.id, "category", e.target.value)} placeholder="Category" />
          </div>
          <Input value={post.excerpt || ""} onChange={e => updateLocal(post.id, "excerpt", e.target.value)} placeholder="Excerpt" />
          <Textarea value={post.content || ""} onChange={e => updateLocal(post.id, "content", e.target.value)} placeholder="Content" rows={4} />
          <Input value={post.read_time || ""} onChange={e => updateLocal(post.id, "read_time", e.target.value)} placeholder="Read time (e.g. 5 min read)" />
          <div className="flex gap-2 items-center">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={post.is_published} onChange={e => updateLocal(post.id, "is_published", e.target.checked)} />
              Published
            </label>
            <div className="flex-1" />
            <Button size="sm" onClick={() => update(post.id, { title: post.title, category: post.category, excerpt: post.excerpt, content: post.content, read_time: post.read_time, is_published: post.is_published })}><Save size={14} className="mr-1" /> Save</Button>
            <Button size="sm" variant="destructive" onClick={() => remove(post.id)}><Trash2 size={14} /></Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminBlogPosts;
