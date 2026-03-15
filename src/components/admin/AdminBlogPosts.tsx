import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/slugify";
import { compressImage } from "@/lib/imageCompression";
import { secureUpload } from "@/lib/secureUpload";
import { validateTextInput, stripHtml, sanitizeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/admin/RichTextEditor";
import SeoFieldsPanel from "@/components/admin/SeoFieldsPanel";
import { toast } from "sonner";
import {
  Plus, Trash2, Save, GripVertical, Pencil, X, Loader2, ImagePlus,
  ExternalLink, CalendarClock, Search, FolderOpen,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import MediaPickerDialog from "@/components/admin/MediaPickerDialog";
import { useBlogCategories } from "@/hooks/useBlogCategories";

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
    setUploading(true);
    try {
      const { blob, wasCompressed, contentType } = await compressImage(file, { maxWidth: 1920, maxHeight: 1080 });
      const { publicUrl } = await secureUpload(blob, contentType, file.name, { directory: "blog-featured" });
      onUpload(publicUrl);
      toast.success(`Image uploaded${wasCompressed ? " (optimized)" : ""}`);
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
            <Button size="sm" variant="secondary" onClick={() => setPickerOpen(true)}>
              <FolderOpen size={14} />
            </Button>
            <Button size="sm" variant="destructive" onClick={onClear}>Remove</Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 rounded-lg text-sm text-muted-foreground transition-colors">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
            {uploading ? "Uploading..." : "Upload image"}
          </button>
          <Button size="sm" variant="outline" onClick={() => setPickerOpen(true)}>
            <FolderOpen size={14} className="mr-1" /> Media Library
          </Button>
        </div>
      )}
      <MediaPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onSelect={onUpload} accept="image" />
    </div>
  );
};

/* ── Category Badge ───────────────────────────────── */

const CategoryBadge = ({ name, colorMap }: { name: string; colorMap: Record<string, string> }) => {
  const color = colorMap[name];
  if (color) {
    return (
      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
        {name}
      </span>
    );
  }
  return <span className="text-xs text-muted-foreground">{name}</span>;
};

/* ── Sortable List Row ───────────────────────────── */

const SortableRow = ({
  post, onEdit, onDelete, selected, onToggleSelect,
}: {
  post: Post; onEdit: (id: string) => void; onDelete: (id: string) => void; selected: boolean; onToggleSelect: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: post.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={`admin-row flex flex-wrap md:flex-nowrap items-start md:items-center gap-2 md:gap-3 px-3 py-3 md:px-4 ${selected ? "selected" : ""}`}>
      <Checkbox checked={selected} onCheckedChange={() => onToggleSelect(post.id)} className="shrink-0 mt-1 md:mt-0" />
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
        <CategoryBadge name={post.category} />
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
  post, onUpdateLocal, onSave, onClose, categoryOptions,
}: {
  post: Post; onUpdateLocal: (id: string, field: string, value: string | boolean) => void; onSave: (post: Post) => void; onClose: () => void; categoryOptions: string[];
}) => {
  const [customCat, setCustomCat] = useState(false);
  return (
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
      <div className="space-y-1">
        <Input value={post.title} onChange={e => {
          onUpdateLocal(post.id, "title", e.target.value);
          // Auto-generate slug if slug is empty or was auto-generated
          const currentSlug = (post as any).slug || "";
          const oldAutoSlug = slugify(post.title);
          if (!currentSlug || currentSlug === oldAutoSlug) {
            onUpdateLocal(post.id, "slug", slugify(e.target.value));
          }
        }} placeholder="Title" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
        {customCat ? (
          <div className="flex gap-2">
            <Input value={post.category} onChange={e => onUpdateLocal(post.id, "category", e.target.value)} placeholder="New category name" className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => setCustomCat(false)}>Use list</Button>
          </div>
        ) : (
          <Select value={post.category || "__new__"} onValueChange={v => { if (v === "__new__") { setCustomCat(true); onUpdateLocal(post.id, "category", ""); } else onUpdateLocal(post.id, "category", v); }}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categoryOptions.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
              <SelectItem value="__new__">+ Add new category</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>

    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">URL Slug</label>
      <div className="flex gap-2">
        <Input value={(post as any).slug || ""} onChange={e => onUpdateLocal(post.id, "slug", slugify(e.target.value))} placeholder="auto-generated-from-title" className="font-mono text-sm" />
        <Button size="sm" variant="outline" type="button" onClick={() => onUpdateLocal(post.id, "slug", slugify(post.title))}>
          Auto
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">/blog/{(post as any).slug || "..."}</p>
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

    {/* SEO Overrides */}
    <SeoFieldsPanel
      values={{
        seo_title: (post as any).seo_title,
        seo_description: (post as any).seo_description,
        seo_keywords: (post as any).seo_keywords,
        seo_canonical_url: (post as any).seo_canonical_url,
        seo_og_title: (post as any).seo_og_title,
        seo_og_description: (post as any).seo_og_description,
        seo_og_image: (post as any).seo_og_image,
        seo_twitter_title: (post as any).seo_twitter_title,
        seo_twitter_description: (post as any).seo_twitter_description,
        seo_twitter_image: (post as any).seo_twitter_image,
      }}
      onChange={(field, value) => onUpdateLocal(post.id, field, value)}
      defaultCanonical={`https://iqbalsir.bd/blog/${(post as any).slug || post.id}`}
    />

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
      <Button size="sm" variant="outline" onClick={() => window.open(`/blog/${(post as any).slug || post.id}`, "_blank")}>
        <ExternalLink size={14} className="mr-1" /> Preview
      </Button>
      <Button size="sm" onClick={() => onSave(post)}>
        <Save size={14} className="mr-1" /> Save Post
      </Button>
    </div>
  </div>
  );
};

/* ── Main Component ──────────────────────────────── */

const AdminBlogPosts = () => {
  const csrfGuard = useCsrfGuard();
  const { categories: managedCategories, categoryMeta } = useBlogCategories();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("__all__");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("sort_order", { ascending: true });
    setPosts(data || []);
    setLoading(false);
  };

  const add = async () => {
    await csrfGuard(async () => {
      const maxOrder = posts.length > 0 ? Math.max(...posts.map(p => (p as any).sort_order ?? 0)) + 1 : 0;
      const newSlug = slugify("new-post") + "-" + Date.now().toString(36);
      const { data, error } = await supabase.from("blog_posts").insert({ title: "New Post", category: "General", excerpt: "", content: "", sort_order: maxOrder, slug: newSlug } as any).select().single();
      if (error) { toast.error(error.message); return; }
      toast.success("Post created — edit it below");
      await fetchAll();
      if (data) setEditingId(data.id);
    }, "content_create", "Created new blog post");
  };

  const updateLocal = (id: string, field: string, value: string | boolean) => {
    setPosts(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const savePost = async (post: Post) => {
    const titleErr = validateTextInput(post.title, "Title", { required: true, maxLength: 300 });
    if (titleErr) { toast.error(titleErr); return; }
    const categoryErr = validateTextInput(post.category, "Category", { required: true, maxLength: 100 });
    if (categoryErr) { toast.error(categoryErr); return; }
    await csrfGuard(async () => {
      const sanitizedContent = post.content ? sanitizeHtml(post.content) : null;
      const { error } = await supabase.from("blog_posts").update({
        title: stripHtml(post.title).trim(),
        category: stripHtml(post.category).trim(),
        excerpt: post.excerpt ? stripHtml(post.excerpt).trim() : null,
        content: sanitizedContent,
        read_time: post.read_time,
        is_published: post.is_published,
        featured_image: (post as any).featured_image || null,
        scheduled_at: (post as any).scheduled_at || null,
        slug: (post as any).slug || null,
        seo_title: (post as any).seo_title || null,
        seo_description: (post as any).seo_description || null,
        seo_keywords: (post as any).seo_keywords || null,
        seo_canonical_url: (post as any).seo_canonical_url || null,
        seo_og_title: (post as any).seo_og_title || null,
        seo_og_description: (post as any).seo_og_description || null,
        seo_og_image: (post as any).seo_og_image || null,
        seo_twitter_title: (post as any).seo_twitter_title || null,
        seo_twitter_description: (post as any).seo_twitter_description || null,
        seo_twitter_image: (post as any).seo_twitter_image || null,
      } as any).eq("id", post.id);
      if (error) {
        if (error.message.includes("blog_posts_slug_unique")) {
          toast.error("This slug is already in use. Please choose a different one.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Post saved");
      }
    }, "content_update", `Updated blog post: ${post.title}`);
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    await csrfGuard(async () => {
      await supabase.from("blog_posts").delete().eq("id", id);
      setPosts(prev => prev.filter(p => p.id !== id));
      if (editingId === id) setEditingId(null);
      toast.success("Deleted");
    }, "content_delete", "Deleted blog post");
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
    await csrfGuard(async () => {
      for (let i = 0; i < posts.length; i++) {
        await supabase.from("blog_posts").update({ sort_order: i } as any).eq("id", posts[i].id);
      }
      setOrderChanged(false);
      toast.success("Order saved");
    });
    setSavingOrder(false);
  };

  /* ── Bulk actions ──────────────────────────────── */
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };
  const toggleSelectAll = () => {
    const allIds = filteredPosts.map(p => p.id);
    setSelectedIds(allIds.every(id => selectedIds.has(id)) ? new Set() : new Set(allIds));
  };
  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected post(s)?`)) return;
    await csrfGuard(async () => {
      setBulkDeleting(true);
      await Promise.all([...selectedIds].map(id => supabase.from("blog_posts").delete().eq("id", id)));
      setPosts(prev => prev.filter(p => !selectedIds.has(p.id)));
      if (editingId && selectedIds.has(editingId)) setEditingId(null);
      toast.success(`${selectedIds.size} post(s) deleted`);
      setSelectedIds(new Set());
      setBulkDeleting(false);
    }, "content_delete", `Bulk deleted ${selectedIds.size} blog posts`);
  };
  const bulkPublish = async (publish: boolean) => {
    if (selectedIds.size === 0) return;
    await csrfGuard(async () => {
      await Promise.all([...selectedIds].map(id => supabase.from("blog_posts").update({ is_published: publish } as any).eq("id", id)));
      setPosts(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, is_published: publish } : p));
      toast.success(`${selectedIds.size} post(s) ${publish ? "published" : "unpublished"}`);
      setSelectedIds(new Set());
    }, "content_update", `Bulk ${publish ? "published" : "unpublished"} ${selectedIds.size} blog posts`);
  };

  // Build color lookup from category metadata
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    categoryMeta.forEach(c => { if (c.color) map[c.name] = c.color; });
    return map;
  }, [categoryMeta]);

  // Merge managed categories with any post-only categories for filter dropdown (ordered by metadata order)
  const categories = useMemo(() => {
    const postCats = [...new Set(posts.map(p => p.category))];
    const ordered = [...managedCategories];
    const mergedSet = new Set(ordered);
    postCats.forEach(c => { if (!mergedSet.has(c)) ordered.push(c); });
    return ordered;
  }, [posts, managedCategories]);

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
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={bulkDeleting} className="animate-in fade-in">
                <Trash2 size={14} className="mr-1" /> {bulkDeleting ? "Deleting…" : `Delete (${selectedIds.size})`}
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkPublish(true)} className="animate-in fade-in">
                Publish ({selectedIds.size})
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkPublish(false)} className="animate-in fade-in">
                Unpublish ({selectedIds.size})
              </Button>
            </>
          )}
          {orderChanged && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-xs text-primary font-medium">Order changed</span>
              <Button size="sm" onClick={saveOrder} disabled={savingOrder}>
                <Save size={14} className="mr-1" /> {savingOrder ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          )}
          <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add Post</Button>
        </div>
      </div>

      {/* Select All */}
      {filteredPosts.length > 0 && (
        <div className="admin-select-all">
          <Checkbox
            checked={filteredPosts.every(p => selectedIds.has(p.id))}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs text-muted-foreground">{selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}</span>
        </div>
      )}

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
            {categories.map(cat => {
              const c = colorMap[cat];
              return (
                <SelectItem key={cat} value={cat}>
                  <span className="flex items-center gap-2">
                    {c && <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c }} />}
                    {cat}
                  </span>
                </SelectItem>
              );
            })}
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
          categoryOptions={categories}
        />
      )}

      {/* Page size selector */}
      <AdminPagination
        total={filteredPosts.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={s => { setPageSize(s); setPage(1); }}
      />

      {/* Sortable List */}
      {(() => {
        const pagedPosts = paginateItems(filteredPosts, page, pageSize);
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pagedPosts.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {pagedPosts.map(post => (
                  <SortableRow
                    key={post.id}
                    post={post}
                    onEdit={(id) => setEditingId(editingId === id ? null : id)}
                    onDelete={remove}
                    selected={selectedIds.has(post.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        );
      })()}

      {filteredPosts.length === 0 && (
        <p className="text-center text-muted-foreground py-10">
          {isFiltering ? "No posts match your search." : "No blog posts yet. Click \"Add Post\" to create one."}
        </p>
      )}
    </div>
  );
};

export default AdminBlogPosts;
