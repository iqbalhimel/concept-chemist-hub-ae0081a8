import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save, CheckSquare, Square, Eye, EyeOff, Search, X } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"blog_posts">;

const AdminBlogPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("__all__");
  const [filterStatus, setFilterStatus] = useState("__all__");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(posts.map(p => p.category))].sort();
    return cats;
  }, [posts]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of posts) counts[p.category] = (counts[p.category] || 0) + 1;
    return counts;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (filterCategory !== "__all__") result = result.filter(p => p.category === filterCategory);
    if (filterStatus === "published") result = result.filter(p => p.is_published);
    else if (filterStatus === "draft") result = result.filter(p => !p.is_published);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.excerpt || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, searchQuery, filterCategory, filterStatus]);

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
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    toast.success("Deleted");
  };

  const updateLocal = (id: string, field: string, value: string | boolean) => {
    setPosts(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredPosts.map(p => p.id);
    if (visibleIds.every(id => selectedIds.has(id))) {
      setSelectedIds(prev => { const next = new Set(prev); visibleIds.forEach(id => next.delete(id)); return next; });
    } else {
      setSelectedIds(prev => new Set([...prev, ...visibleIds]));
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected post(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    for (const id of selectedIds) {
      await supabase.from("blog_posts").delete().eq("id", id);
    }
    setPosts(prev => prev.filter(p => !selectedIds.has(p.id)));
    toast.success(`${selectedIds.size} post(s) deleted`);
    setSelectedIds(new Set());
    setBulkDeleting(false);
  };

  const bulkTogglePublished = async (publish: boolean) => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await supabase.from("blog_posts").update({ is_published: publish }).eq("id", id);
    }
    setPosts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, is_published: publish } : p));
    toast.success(`${selectedIds.size} post(s) ${publish ? "published" : "unpublished"}`);
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mt-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Blog Posts <span className="text-base font-normal text-muted-foreground">({posts.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={() => bulkTogglePublished(true)} className="animate-in fade-in">
                <Eye size={14} className="mr-1" /> Publish ({selectedIds.size})
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkTogglePublished(false)} className="animate-in fade-in">
                <EyeOff size={14} className="mr-1" /> Unpublish ({selectedIds.size})
              </Button>
              <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={bulkDeleting} className="animate-in fade-in">
                <Trash2 size={14} className="mr-1" />
                {bulkDeleting ? "Deleting…" : `Delete (${selectedIds.size})`}
              </Button>
            </>
          )}
          <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add Post</Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search by title, category, or excerpt..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat} ({categoryCounts[cat] || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(searchQuery || filterCategory !== "__all__" || filterStatus !== "__all__") && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredPosts.length} of {posts.length} posts
          {searchQuery && <> matching "{searchQuery}"</>}
          {filterCategory !== "__all__" && <> in {filterCategory}</>}
          {filterStatus !== "__all__" && <> ({filterStatus})</>}
        </p>
      )}

      {filteredPosts.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
            {filteredPosts.every(p => selectedIds.has(p.id)) ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
          <span className="text-xs text-muted-foreground">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
          </span>
        </div>
      )}

      {filteredPosts.map(post => (
        <div key={post.id} className={`glass-card p-4 space-y-2 ${selectedIds.has(post.id) ? "ring-2 ring-primary/50" : ""}`}>
          <div className="flex items-center gap-2 -mb-1">
            <button onClick={() => toggleSelect(post.id)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
              {selectedIds.has(post.id) ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
            </button>
            <span className="text-xs text-muted-foreground truncate">{post.title}</span>
            {!post.is_published && <span className="text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Draft</span>}
          </div>
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
