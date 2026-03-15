import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload, GripVertical, Pencil, Search, X, FolderOpen, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import type { Tables } from "@/integrations/supabase/types";
import { compressImage } from "@/lib/imageCompression";
import { secureUpload } from "@/lib/secureUpload";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import MediaPickerDialog from "@/components/admin/MediaPickerDialog";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type GalleryItem = Tables<"gallery">;

const SPAN_LABELS: Record<string, string> = {
  normal: "Normal",
  wide: "Wide",
  tall: "Tall",
  large: "Large",
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fetchImageSize = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const len = res.headers.get("content-length");
    if (len) return formatFileSize(Number(len));
  } catch { /* ignore */ }
  return null;
};

const SortableRow = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-start">
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground touch-none pt-3.5 pl-3 pr-1"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
};

const AdminGallery = () => {
  const csrfGuard = useCsrfGuard();
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
  const [expandedDeleteId, setExpandedDeleteId] = useState<string | null>(null);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  // Store file sizes locally since the DB column doesn't exist yet
  const [fileSizes, setFileSizes] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const newTitleRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i =>
      (i.label || "").toLowerCase().includes(q) ||
      (i.alt || "").toLowerCase().includes(q) ||
      (i.span || "").toLowerCase().includes(q) ||
      i.image_url.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (newItemId) {
      setExpandedEditId(newItemId);
      setExpandedDeleteId(null);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => { newTitleRef.current?.focus(); setNewItemId(null); }, 100);
    }
  }, [newItemId]);

  // Auto-detect file sizes for items that don't have one
  useEffect(() => {
    items.forEach(item => {
      if (item.image_url && !fileSizes[item.id]) {
        fetchImageSize(item.image_url).then(size => {
          if (size) setFileSizes(prev => ({ ...prev, [item.id]: size }));
        });
      }
    });
  }, [items]);

  const fetchAll = async () => {
    const { data } = await supabase.from("gallery").select("*").order("sort_order", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    const newItems: GalleryItem[] = [];
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const { blob, contentType } = await compressImage(file);

      let result: { publicUrl: string };
      try {
        result = await secureUpload(blob, contentType, file.name, { directory: "gallery" });
      } catch (uploadErr: any) {
        toast.error(uploadErr.message || "Upload failed");
        continue;
      }
      const urlData = result;
      const label = file.name.replace(/\.[^.]+$/, "");

      const { data, error } = await supabase.from("gallery").insert({
        image_url: urlData.publicUrl,
        label,
        alt: label,
        sort_order: 0,
      }).select().single();

      if (error) { toast.error(error.message); continue; }
      if (data) {
        newItems.push(data);
        // Store file size from the original blob
        setFileSizes(prev => ({ ...prev, [data.id]: formatFileSize(blob.size) }));
      }
    }

    if (newItems.length > 0) {
      // Shift existing sort orders
      const updated = items.map((n, i) => ({ ...n, sort_order: i + newItems.length }));
      for (const u of updated) {
        await supabase.from("gallery").update({ sort_order: u.sort_order }).eq("id", u.id);
      }
      // Set new items at top with sort_order 0..n
      for (let i = 0; i < newItems.length; i++) {
        await supabase.from("gallery").update({ sort_order: i }).eq("id", newItems[i].id);
        newItems[i] = { ...newItems[i], sort_order: i };
      }
      setItems([...newItems, ...updated]);
      setNewItemId(newItems[0].id);
      toast.success(`${newItems.length} image(s) added`);
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const add = async () => {
    const { data, error } = await supabase.from("gallery").insert({ image_url: "", label: "New Image", sort_order: 0 }).select().single();
    if (error || !data) { toast.error(error?.message || "Failed"); return; }
    const updated = items.map((n, i) => ({ ...n, sort_order: i + 1 }));
    for (const u of updated) {
      await supabase.from("gallery").update({ sort_order: u.sort_order }).eq("id", u.id);
    }
    setItems([data, ...updated]);
    setNewItemId(data.id);
    toast.success("Added");
  };

  const update = async (item: GalleryItem) => {
    await csrfGuard(async () => {
      const { error } = await supabase.from("gallery").update({ image_url: item.image_url, label: item.label, alt: item.alt, span: item.span }).eq("id", item.id);
      if (error) toast.error(error.message); else toast.success("Updated");
    });
  };

  const remove = async (id: string, imageUrl: string) => {
    await csrfGuard(async () => {
      const urlParts = imageUrl.split("/media/");
      if (urlParts[1]) {
        await supabase.storage.from("media").remove([urlParts[1]]);
      }
      await supabase.from("gallery").delete().eq("id", id);
      setItems(prev => prev.filter(n => n.id !== id));
      setExpandedDeleteId(null);
      toast.success("Deleted");
    });
  };

  const updateLocal = (id: string, field: string, value: string) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
    // Auto-detect size when URL changes
    if (field === "image_url" && value) {
      fetchImageSize(value).then(size => {
        if (size) setFileSizes(prev => ({ ...prev, [id]: size }));
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    await Promise.all(reordered.map((item, idx) =>
      supabase.from("gallery").update({ sort_order: idx }).eq("id", item.id)
    ));
    toast.success("Order updated");
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div ref={topRef} className="flex items-center justify-between flex-wrap gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mt-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Gallery <span className="text-base font-normal text-muted-foreground">({items.length})</span>
        </h2>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} size="sm" disabled={uploading}>
            <Upload size={14} className="mr-1" /> {uploading ? "Uploading..." : "Upload Images"}
          </Button>
          <Button onClick={add} size="sm" variant="outline"><Plus size={14} className="mr-1" /> Add by URL</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9 h-9" placeholder="Search images by title..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }} />
        {searchQuery && (
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery("")}>
            <X size={14} />
          </button>
        )}
      </div>
      {searchQuery && (
        <p className="text-xs text-muted-foreground">Showing {filteredItems.length} of {items.length} items matching "{searchQuery}"</p>
      )}

      <AdminPagination total={filteredItems.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={s => { setPageSize(s); setPage(1); }} />

      {(() => {
        const pagedItems = paginateItems(filteredItems, page, pageSize);
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pagedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                {/* Desktop header */}
                <div className="hidden md:grid md:grid-cols-[auto_48px_1fr_auto_auto_auto] gap-3 items-center px-4 py-2 bg-muted/40 text-xs font-medium text-muted-foreground">
                  <span className="w-8" />
                  <span>Thumb</span>
                  <span>Title</span>
                  <span className="w-20 text-right">Size</span>
                  <span className="w-20 text-center">Type</span>
                  <span className="w-24 text-right">Actions</span>
                </div>

                {pagedItems.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {items.length === 0 ? "No gallery images yet. Upload images or add by URL." : "No images match your search."}
                  </div>
                )}

                {pagedItems.map(item => {
                  const isEditing = expandedEditId === item.id;
                  const isDeleting = expandedDeleteId === item.id;
                  const size = fileSizes[item.id] || "—";

                  return (
                    <SortableRow key={item.id} id={item.id}>
                      <div>
                        {/* Desktop row */}
                        <div className="hidden md:grid md:grid-cols-[auto_48px_1fr_auto_auto_auto] gap-3 items-center px-3 py-2.5">
                          <span className="w-8" />
                          <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.alt || ""} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">No img</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-foreground truncate">{item.label || "Untitled"}</span>
                          <span className="w-20 text-xs text-muted-foreground text-right">{size}</span>
                          <span className="w-20 text-xs text-muted-foreground text-center capitalize">{SPAN_LABELS[item.span || "normal"]}</span>
                          <div className="w-24 flex items-center justify-end gap-1">
                            <Button size="sm" variant={isEditing ? "default" : "outline"} className="h-7 px-2 text-xs"
                              onClick={() => { setExpandedEditId(isEditing ? null : item.id); setExpandedDeleteId(null); }}>
                              <Pencil size={12} className="mr-1" /> Edit
                            </Button>
                            <Button size="sm" variant={isDeleting ? "destructive" : "outline"} className="h-7 px-2 text-xs"
                              onClick={() => { setExpandedDeleteId(isDeleting ? null : item.id); if (!isDeleting) setExpandedEditId(null); }}>
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>

                        {/* Mobile row */}
                        <div className="md:hidden px-3 py-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-muted overflow-hidden shrink-0">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.alt || ""} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">No img</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.label || "Untitled"}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{size}</span>
                                <span>•</span>
                                <span className="capitalize">{SPAN_LABELS[item.span || "normal"]}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pl-[52px]">
                            <Button size="sm" variant={isEditing ? "default" : "outline"} className="h-7 px-2 text-xs flex-1"
                              onClick={() => { setExpandedEditId(isEditing ? null : item.id); setExpandedDeleteId(null); }}>
                              <Pencil size={12} className="mr-1" /> Edit
                            </Button>
                            <Button size="sm" variant={isDeleting ? "destructive" : "outline"} className="h-7 px-2 text-xs flex-1"
                              onClick={() => { setExpandedDeleteId(isDeleting ? null : item.id); if (!isDeleting) setExpandedEditId(null); }}>
                              <Trash2 size={12} className="mr-1" /> Delete
                            </Button>
                          </div>
                        </div>

                        {/* Delete confirmation */}
                        {isDeleting && (
                          <div className="px-4 py-3 bg-destructive/5 border-t border-destructive/20">
                            <p className="text-sm text-foreground mb-2">Are you sure you want to delete this image?</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setExpandedDeleteId(null)}>Cancel</Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => remove(item.id, item.image_url)}>
                                <Trash2 size={12} className="mr-1" /> Confirm Delete
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Edit form */}
                        {isEditing && (
                          <div className="px-4 py-4 bg-muted/20 border-t border-border space-y-3">
                            {item.image_url && (
                              <img src={item.image_url} alt={item.alt || ""} className="w-32 h-24 rounded-lg object-cover bg-muted" />
                            )}
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                                <Input ref={expandedEditId === item.id ? newTitleRef : undefined} value={item.label || ""} onChange={e => updateLocal(item.id, "label", e.target.value)} placeholder="Image title" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Alt Text</label>
                                <Input value={item.alt || ""} onChange={e => updateLocal(item.id, "alt", e.target.value)} placeholder="Alt text for accessibility" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Image URL</label>
                                <div className="flex gap-2">
                                  <Input value={item.image_url} onChange={e => updateLocal(item.id, "image_url", e.target.value)} placeholder="Image URL" className="flex-1" />
                                  <Button size="sm" variant="outline" onClick={() => setMediaPickerTarget(item.id)}>
                                    <FolderOpen size={14} />
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Type / Span</label>
                                <select
                                  value={item.span || "normal"}
                                  onChange={e => updateLocal(item.id, "span", e.target.value)}
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="wide">Wide (2 cols)</option>
                                  <option value="tall">Tall (2 rows)</option>
                                  <option value="large">Large (2×2)</option>
                                </select>
                              </div>
                            </div>
                            {fileSizes[item.id] && (
                              <p className="text-xs text-muted-foreground">File size: {fileSizes[item.id]}</p>
                            )}
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setExpandedEditId(null)}>Cancel</Button>
                              <Button size="sm" onClick={() => { update(item); setExpandedEditId(null); }}>
                                <Save size={14} className="mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </SortableRow>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        );
      })()}
      <MediaPickerDialog
        open={!!mediaPickerTarget}
        onOpenChange={(open) => { if (!open) setMediaPickerTarget(null); }}
        onSelect={(url) => {
          if (mediaPickerTarget) {
            updateLocal(mediaPickerTarget, "image_url", url);
          }
        }}
        accept="image"
      />
    </div>
  );
};

export default AdminGallery;
