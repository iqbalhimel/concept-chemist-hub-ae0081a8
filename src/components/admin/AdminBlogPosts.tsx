import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { toast } from "sonner";
import {
  Plus, Trash2, Save, GripVertical, Pencil, X, Loader2, ImagePlus,
  ExternalLink, CalendarClock, Search,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Tables } from "@/integrations/supabase/types";

type Post = Tables<"blog_posts">;

/* ── helpers ─────────────────────────────────────── */

const calcReadTime = (html: string): string => {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

/* ── Featured Image ──────────────────────────────── */

const FeaturedImageField = ({ imageUrl, onUpload, onClear }: { imageUrl: string; onUpload: (url: string) => void; onClear: () => void }) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
    setUploading(true);
    try {
      const fileName = `blog-featured/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("media").upload(fileName, file, { contentType: file.type });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(fileName);
      onUpload(data.publicUrl);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Featured Image</label>
      <input type="file" accept="image/*" className="hidden" ref={inputRef} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }} />
      {imageUrl ? (
        <div className="relative group w-full max-w-xs">
          <img src={imageUrl} alt="Featured" className="rounded-lg w-full h-32 object-cover border border-border" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 size={14} className="animate-spin" /> : "Replace"}
            </Button>
            <Button size="sm" variant="destructive" onClick={onClear}>Remove</Button>
          </div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 rounded-lg text-sm text-muted-foreground transition-colors">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
          {uploading ? "Uploading..." : "Add featured image"}
        </button>
      )}
    </div>
  );
};

/* ── Sortable List Row ───────────────────────────── */

const SortableRow = ({
  post, onEdit, onDelete,
}: {
  post: Post; onEdit: (id: string) => void; onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: post.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-wrap md:flex-nowrap items-start md:items-center gap-2 md:gap-3 px-3 py-3 md:px-4 border border-border rounded-lg bg-card hover:bg-muted/40 transition-colors">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground touch-none shrink-0 mt-1 md:mt-0">
        <GripVertical size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground truncate">{post.title}</span>
          {!post.is_published && (
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">Draft</span>
          )}
          {(post as any).scheduled_at && !post.is_published && (
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">Scheduled</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{post.category}</span>
      </div>

      <div className="flex items-center gap-1 w-full md:w-auto mt-1 md:mt-0">
        <Button size="sm" variant="ghost" onClick={() => onEdit(post.id)}>
          <Pencil size={14} className="mr-1 md:mr-0" /><span className="md:hidden text-xs">Edit</span>
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(post.id)}>
          <Trash2 size={14} className="mr-1 md:mr-0" /><span className="md:hidden text-xs">Delete</span>
        </Button>
      </div>
    </div>
  );
};

/* ── Edit Panel ──────────────────────────────────── */

const EditPanel = ({
  post, onUpdateLocal, onSave, onClose,
}: {
  post: Post; onUpdateLocal: (id: string, field: string, value: string | boolean) => void; onSave: (post: Post) => void; onClose: () => void;
}) => (
  <div className="border border-primary/30 rounded-lg bg-card p-5 space-y-3 animate-in slide-in-from-top-2">
    <div className="flex items-center justify-between">
      <h3 className="font-display text-lg font-bold text-foreground">Editing: {post.title}</h3>
      <Button size="sm" variant="ghost" onClick={onClose}><X size={16} /></Button>
    </div>

    <FeaturedImageField
      imageUrl={(post as any).featured_image || ""}
      onUpload={(url) => onUpdateLocal(post.id, "featured_image", url)}
      onClear={() => onUpdateLocal(post.id, "featured_image", "")}
    />

    <div className="grid gap-2 sm:grid-cols-2">
      <Input value={post.title} onChange={e => onUpdateLocal(post.id, "title", e.target.value)} placeholder="Title" />
      <Input value={post.category} onChange={e => onUpdateLocal(post.id, "category", e.target.value)} placeholder="Category" />
    </div>

    <Input value={post.excerpt || ""} onChange={e => onUpdateLocal(post.id, "excerpt", e.target.value)} placeholder="Excerpt" />

    <RichTextEditor
      content={post.content || ""}
      onChange={(html) => { onUpdateLocal(post.id, "content", html); onUpdateLocal(post.id, "read_time", calcReadTime(html)); }}
      placeholder="Write your blog post content..."
    />

    <p className="text-xs text-muted-foreground">
      Estimated read time: <span className="font-medium text-foreground">{post.read_time || calcReadTime(post.content || "")}</span>
    </p>

    {/* Scheduling */}
    {!post.is_published && (
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarClock size={14} className="text-muted-foreground" />
        <label className="text-xs text-muted-foreground">Schedule publish:</label>
        <Input
          type="datetime-local"
          className="w-auto h-8 text-xs"
          value={(post as any).scheduled_at ? new Date(new Date((post as any).scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
          onChange={e => {
            const val = e.target.value;
            onUpdateLocal(post.id, "scheduled_at", val ? new Date(val).toISOString() : "");
          }}
        />
        {(post as any).scheduled_at && (
          <>
            <button onClick={() => onUpdateLocal(post.id, "scheduled_at", "")} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-0.5">
              <X size={12} /> Clear
            </button>
            <span className="text-xs text-primary font-medium">
              Will auto-publish {new Date((post as any).scheduled_at).toLocaleString()}
            </span>
          </>
        )}
      </div>
    )}

    <div className="flex gap-2 items-center pt-2 border-t border-border">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" checked={post.is_published} onChange={e => { onUpdateLocal(post.id, "is_published", e.target.checked); if (e.target.checked) onUpdateLocal(post.id, "scheduled_at", ""); }} />
        Published
      </label>
      <div className="flex-1" />
      <Button size="sm" variant="outline" onClick={() => window.open(`/blog/${post.id}`, "_blank")}>
        <ExternalLink size={14} className="mr-1" /> Preview
      </Button>
      <Button size="sm" onClick={() => onSave(post)}>
        <Save size={14} className="mr-1" /> Save Post
      </Button>
    </div>
  </div>
);

/* ── Main Component ──────────────────────────────── */

const AdminBlogPosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("__all__");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("sort_order", { ascending: true });
    setPosts(data || []);
    setLoading(false);
  };

  const add = async () => {
    const maxOrder = posts.length > 0 ? Math.max(...posts.map(p => (p as any).sort_order ?? 0)) + 1 : 0;
    const { error } = await supabase.from("blog_posts").insert({ title: "New Post", category: "General", excerpt: "", content: "", sort_order: maxOrder } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Post added");
    fetchAll();
  };

  const updateLocal = (id: string, field: string, value: string | boolean) => {
    setPosts(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const savePost = async (post: Post) => {
    const { error } = await supabase.from("blog_posts").update({
      title: post.title,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      read_time: post.read_time,
      is_published: post.is_published,
      featured_image: (post as any).featured_image || null,
      scheduled_at: (post as any).scheduled_at || null,
    } as any).eq("id", post.id);
    if (error) toast.error(error.message); else toast.success("Post saved");
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
    if (editingId === id) setEditingId(null);
    toast.success("Deleted");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setPosts(prev => {
      const oldIndex = prev.findIndex(p => p.id === active.id);
      const newIndex = prev.findIndex(p => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setOrderChanged(true);
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    for (let i = 0; i < posts.length; i++) {
      await supabase.from("blog_posts").update({ sort_order: i } as any).eq("id", posts[i].id);
    }
    setOrderChanged(false);
    setSavingOrder(false);
    toast.success("Order saved");
  };

  const categories = useMemo(() => [...new Set(posts.map(p => p.category))].sort(), [posts]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (filterCategory !== "__all__") result = result.filter(p => p.category === filterCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    }
    return result;
  }, [posts, searchQuery, filterCategory]);

  const isFiltering = searchQuery.trim() !== "" || filterCategory !== "__all__";

  const editingPost = editingId ? posts.find(p => p.id === editingId) : null;

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mt-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Blog Posts <span className="text-base font-normal text-muted-foreground">({posts.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          {orderChanged && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-xs text-primary font-medium">Order changed – click Save Changes</span>
              <Button size="sm" onClick={saveOrder} disabled={savingOrder}>
                <Save size={14} className="mr-1" /> {savingOrder ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          )}
          <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add Post</Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search by title or category..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
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
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isFiltering && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredPosts.length} of {posts.length} posts
          {searchQuery && <> matching "{searchQuery}"</>}
          {filterCategory !== "__all__" && <> in {filterCategory}</>}
        </p>
      )}

      {/* Edit Panel (shown above list when editing) */}
      {editingPost && (
        <EditPanel
          post={editingPost}
          onUpdateLocal={updateLocal}
          onSave={savePost}
          onClose={() => setEditingId(null)}
        />
      )}

      {/* Sortable List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredPosts.map(p => p.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {filteredPosts.map(post => (
              <SortableRow
                key={post.id}
                post={post}
                onEdit={(id) => setEditingId(editingId === id ? null : id)}
                onDelete={remove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredPosts.length === 0 && (
        <p className="text-center text-muted-foreground py-10">
          {isFiltering ? "No posts match your search." : "No blog posts yet. Click \"Add Post\" to create one."}
        </p>
      )}
    </div>
  );
};

export default AdminBlogPosts;
