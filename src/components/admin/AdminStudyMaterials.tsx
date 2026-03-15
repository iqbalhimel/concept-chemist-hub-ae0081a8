import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload, Loader2, FileUp, Pencil, Tags, GripVertical, Search, X, Check, Eye, EyeOff, AlertTriangle } from "lucide-react";
import ContentSchedulingFields, { getContentStatus, ContentStatusBadge } from "@/components/admin/ContentSchedulingFields";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import type { Tables } from "@/integrations/supabase/types";
import SeoFieldsPanel from "@/components/admin/SeoFieldsPanel";
import * as pdfjsLib from "pdfjs-dist";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { secureUpload } from "@/lib/secureUpload";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

type Material = Tables<"study_materials">;

type StudyCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="absolute left-2 top-4 z-10 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const extractPdfMeta = async (file: File) => {
  let pageCount: number | null = null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    pageCount = pdf.numPages;
  } catch (err) {
    console.warn("Could not extract PDF metadata:", err);
  }
  return { pageCount, fileSize: formatFileSize(file.size) };
};

const uploadToStorage = async (file: File) => {
  const { publicUrl } = await secureUpload(file, "application/pdf", file.name, { directory: "study-materials" });
  return publicUrl;
};

const AdminStudyMaterials = () => {
  const csrfGuard = useCsrfGuard();
  const [items, setItems] = useState<Material[]>([]);
  const [categories, setCategories] = useState<StudyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkCategory, setBulkCategory] = useState("");
  const [showCatManager, setShowCatManager] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [catActionLoading, setCatActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("__all__");
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [newItemId, setNewItemId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
  const [expandedDeleteId, setExpandedDeleteId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const bulkInputRef = useRef<HTMLInputElement | null>(null);
  const newTitleRef = useRef<HTMLInputElement | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeCategories = useMemo(() => categories.filter(c => c.is_active), [categories]);
  const categoryNames = useMemo(() => categories.map(c => c.name), [categories]);
  const activeCategoryNames = useMemo(() => activeCategories.map(c => c.name), [activeCategories]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (filterCategory !== "__all__") {
      result = result.filter(i => i.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.file_url || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, searchQuery, filterCategory]);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  // Warn before leaving with unsaved order
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (orderDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [orderDirty]);

  // Auto-expand and focus new item
  useEffect(() => {
    if (newItemId) {
      setExpandedEditId(newItemId);
      setExpandedDeleteId(null);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        newTitleRef.current?.focus();
        setNewItemId(null);
      }, 100);
    }
  }, [newItemId]);

  const fetchItems = async () => {
    const { data } = await supabase.from("study_materials").select("*").order("sort_order");
    setItems(data || []);
    setLoading(false);
    setOrderDirty(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("study_categories").select("*").order("sort_order");
    const cats = (data || []) as StudyCategory[];
    setCategories(cats);
    if (cats.length > 0 && !bulkCategory) {
      const firstActive = cats.find(c => c.is_active);
      if (firstActive) setBulkCategory(firstActive.name);
    }
  };

  // --- Material CRUD ---
  const add = async () => {
    await csrfGuard(async () => {
      const defaultCat = activeCategoryNames[0] || "Uncategorized";
      const { data, error } = await supabase.from("study_materials").insert({ title: "New Material", category: defaultCat, sort_order: 0 }).select().single();
      if (error || !data) { toast.error(error?.message || "Failed"); return; }
      const updated = items.map((n, i) => ({ ...n, sort_order: i + 1 }));
      for (const u of updated) {
        await supabase.from("study_materials").update({ sort_order: u.sort_order }).eq("id", u.id);
      }
      setItems([data, ...updated]);
      setNewItemId(data.id);
      toast.success("Added");
    });
  };

  const update = async (id: string, updates: Partial<Material>) => {
    await csrfGuard(async () => {
      const { error } = await supabase.from("study_materials").update(updates).eq("id", id);
      if (error) toast.error(error.message); else toast.success("Updated");
    });
  };

  const remove = async (id: string) => {
    await csrfGuard(async () => {
      await supabase.from("study_materials").delete().eq("id", id);
      setItems(prev => prev.filter(n => n.id !== id));
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      toast.success("Deleted");
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredItems.map(i => i.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => new Set([...prev, ...visibleIds]));
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected item(s)? This cannot be undone.`)) return;
    await csrfGuard(async () => {
      setBulkDeleting(true);
      for (const id of selectedIds) {
        await supabase.from("study_materials").delete().eq("id", id);
      }
      setItems(prev => prev.filter(n => !selectedIds.has(n.id)));
      toast.success(`${selectedIds.size} item(s) deleted`);
      setSelectedIds(new Set());
      setBulkDeleting(false);
    });
  };

  const updateLocal = (id: string, field: string, value: string | number | boolean | null) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    setItems(arrayMove(items, oldIndex, newIndex));
    setOrderDirty(true);
  }, [items]);

  const saveOrder = useCallback(async () => {
    await csrfGuard(async () => {
      setSavingOrder(true);
      for (let i = 0; i < items.length; i++) {
        await supabase.from("study_materials").update({ sort_order: i }).eq("id", items[i].id);
      }
      setOrderDirty(false);
      setSavingOrder(false);
      toast.success("Order saved");
    });
  }, [items, csrfGuard]);

  // --- Category CRUD ---
  const addCategory = async () => {
    const name = newCatName.trim();
    if (!name) return;
    if (categoryNames.includes(name)) { toast.error("Category already exists"); return; }
    const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const nextOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 0;
    const { error } = await supabase.from("study_categories").insert({ name, slug, sort_order: nextOrder } as any);
    if (error) { toast.error(error.message); return; }
    setNewCatName("");
    toast.success(`Category "${name}" added`);
    fetchCategories();
  };

  const updateCategory = async (id: string, updates: Partial<StudyCategory>) => {
    const { error } = await supabase.from("study_categories").update(updates as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchCategories();
  };

  const renameCategory = async (cat: StudyCategory) => {
    const newName = editCatName.trim();
    if (!newName || newName === cat.name) { setEditingCatId(null); return; }
    setCatActionLoading(true);
    await updateCategory(cat.id, { name: newName, slug: newName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") });
    const affected = items.filter(i => i.category === cat.name);
    for (const item of affected) {
      await supabase.from("study_materials").update({ category: newName }).eq("id", item.id);
    }
    toast.success(`Renamed "${cat.name}" → "${newName}" (${affected.length} items updated)`);
    setEditingCatId(null);
    setCatActionLoading(false);
    fetchItems();
  };

  const deleteCategory = async (cat: StudyCategory) => {
    if (cat.slug === "uncategorized") { toast.error("Cannot delete Uncategorized"); return; }
    const affected = items.filter(i => i.category === cat.name);
    const msg = affected.length > 0
      ? `Delete "${cat.name}" and move ${affected.length} item(s) to "Uncategorized"?`
      : `Delete "${cat.name}"?`;
    if (!window.confirm(msg)) return;
    setCatActionLoading(true);
    for (const item of affected) {
      await supabase.from("study_materials").update({ category: "Uncategorized" }).eq("id", item.id);
    }
    await supabase.from("study_categories").delete().eq("id", cat.id);
    toast.success(`Deleted "${cat.name}"`);
    setCatActionLoading(false);
    fetchCategories();
    fetchItems();
  };

  const toggleCategoryActive = async (cat: StudyCategory) => {
    if (cat.slug === "uncategorized") return;
    await updateCategory(cat.id, { is_active: !cat.is_active });
    toast.success(cat.is_active ? `"${cat.name}" hidden` : `"${cat.name}" activated`);
  };

  const handleCatDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from("study_categories").update({ sort_order: i } as any).eq("id", reordered[i].id);
    }
    toast.success("Category order updated");
  }, [categories]);

  // --- File upload ---
  const handleFileUpload = async (id: string, file: File) => {
    if (file.type !== "application/pdf") { toast.error("Only PDF files are supported"); return; }
    setUploadingId(id);
    setUploadProgress(10);
    const { pageCount, fileSize } = await extractPdfMeta(file);
    setUploadProgress(40);
    try {
      setUploadProgress(50);
      const fileUrl = await uploadToStorage(file);
      setUploadProgress(80);
      updateLocal(id, "file_url", fileUrl);
      updateLocal(id, "file_size", fileSize);
      if (pageCount !== null) updateLocal(id, "pages", pageCount);
      const currentItem = items.find(x => x.id === id);
      if (currentItem?.title === "New Material") {
        updateLocal(id, "title", file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "));
      }
      setUploadProgress(100);
      toast.success(`PDF uploaded — ${fileSize}, ${pageCount ?? "?"} pages`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setTimeout(() => { setUploadingId(null); setUploadProgress(0); }, 500);
    }
  };

  const handleBulkUpload = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(f => f.type === "application/pdf");
    if (pdfFiles.length === 0) { toast.error("No PDF files found"); return; }
    setBulkUploading(true);
    setBulkProgress({ current: 0, total: pdfFiles.length });
    let successCount = 0;
    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      setBulkProgress({ current: i + 1, total: pdfFiles.length });
      try {
        const [{ pageCount, fileSize }, fileUrl] = await Promise.all([extractPdfMeta(file), uploadToStorage(file)]);
        const { error } = await supabase.from("study_materials").insert({
          title: file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "),
          category: bulkCategory || "Uncategorized",
          file_url: fileUrl, file_size: fileSize, pages: pageCount,
        });
        if (error) throw error;
        successCount++;
      } catch (err: any) {
        toast.error(`Failed: ${file.name}`);
      }
    }
    setBulkUploading(false);
    setBulkProgress({ current: 0, total: 0 });
    if (successCount > 0) { toast.success(`${successCount} PDF(s) uploaded`); fetchItems(); }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div ref={topRef} className="flex flex-wrap items-center justify-between gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mt-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Study Materials <span className="text-base font-normal text-muted-foreground">({items.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {orderDirty && (
            <>
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle size={12} /> Order changed
              </span>
              <Button size="sm" onClick={saveOrder} disabled={savingOrder} className="animate-in fade-in">
                <Save size={14} className="mr-1" />
                {savingOrder ? "Saving…" : "Save Order"}
              </Button>
            </>
          )}
          <Button onClick={() => setShowCatManager(v => !v)} size="sm" variant="outline">
            <Tags size={14} className="mr-1" /> Categories
          </Button>
          <Button onClick={() => bulkInputRef.current?.click()} size="sm" variant="outline" disabled={bulkUploading}>
            <FileUp size={14} className="mr-1" /> Bulk Upload
          </Button>
          <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add</Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9 h-9" placeholder="Search by title, category, or URL..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && (
            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery("")}>
              <X size={14} />
            </button>
          )}
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.name}>{cat.name} ({categoryCounts[cat.name] || 0})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {(searchQuery || filterCategory !== "__all__") && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredItems.length} of {items.length} items
          {searchQuery && <> matching "{searchQuery}"</>}
          {filterCategory !== "__all__" && <> in {filterCategory}</>}
        </p>
      )}

      {/* Category Manager */}
      {showCatManager && (
        <div className="border border-border rounded-lg p-4 bg-muted/30 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Manage Categories</h3>
            <span className="text-xs text-muted-foreground">{categories.length} categories</span>
          </div>

          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); addCategory(); }}>
            <Input className="h-8 text-xs flex-1" placeholder="New category name..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
            <Button type="submit" size="sm" variant="outline" className="h-8 text-xs" disabled={!newCatName.trim()}>
              <Plus size={12} className="mr-1" /> Add Category
            </Button>
          </form>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCatDragEnd}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {categories.map(cat => (
                  <SortableItem key={cat.id} id={cat.id}>
                    <div className={`flex items-center gap-2 text-sm py-1 ${cat.is_active ? "" : "opacity-50"}`}>
                      {editingCatId === cat.id ? (
                        <form className="flex gap-1 flex-1" onSubmit={e => { e.preventDefault(); renameCategory(cat); }}>
                          <Input className="h-7 text-xs flex-1" value={editCatName} onChange={e => setEditCatName(e.target.value)} autoFocus disabled={catActionLoading} />
                          <Button type="submit" size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={catActionLoading}>
                            <Check size={12} />
                          </Button>
                          <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingCatId(null)}>
                            <X size={12} />
                          </Button>
                        </form>
                      ) : (
                        <>
                          <span className="flex-1 truncate">
                            {cat.name}
                            <span className="text-muted-foreground ml-1">({categoryCounts[cat.name] || 0})</span>
                          </span>
                          <Button size="sm" variant="ghost" className="h-7 px-2" title="Toggle visibility"
                            disabled={catActionLoading || cat.slug === "uncategorized"}
                            onClick={() => toggleCategoryActive(cat)}>
                            {cat.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2" disabled={catActionLoading}
                            onClick={() => { setEditingCatId(cat.id); setEditCatName(cat.name); }}>
                            <Pencil size={12} />
                          </Button>
                          {cat.slug !== "uncategorized" && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive"
                              disabled={catActionLoading} onClick={() => deleteCategory(cat)}>
                              <Trash2 size={12} />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <p className="text-xs text-muted-foreground/60">
            Drag to reorder. Toggle visibility with the eye icon. Deleting moves materials to "Uncategorized".
          </p>
        </div>
      )}

      {/* Bulk drop zone */}
      <input type="file" accept=".pdf" multiple className="hidden" ref={bulkInputRef}
        onChange={e => { if (e.target.files?.length) handleBulkUpload(e.target.files); e.target.value = ""; }} />
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          bulkDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-muted-foreground/40"
        }`}
        onDragOver={e => { e.preventDefault(); setBulkDragOver(true); }}
        onDragLeave={() => setBulkDragOver(false)}
        onDrop={e => { e.preventDefault(); setBulkDragOver(false); if (e.dataTransfer.files?.length) handleBulkUpload(e.dataTransfer.files); }}
      >
        {bulkUploading ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Uploading {bulkProgress.current} of {bulkProgress.total} PDFs...
            </div>
            <Progress value={(bulkProgress.current / bulkProgress.total) * 100} className="h-2 max-w-xs mx-auto" />
          </div>
        ) : (
          <div className="space-y-3">
            <FileUp size={24} className="mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Drag & drop multiple PDFs here to bulk create study materials</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground">Category:</span>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger className="w-44 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {activeCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground/60">Each PDF becomes a new entry with auto-detected title, size & pages</p>
          </div>
        )}
      </div>

      {/* Select all toggle */}
      {filteredItems.length > 0 && (
        <div className="admin-select-all">
          <Checkbox
            checked={filteredItems.every(i => selectedIds.has(i.id))}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-xs text-muted-foreground">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
          </span>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="admin-bulk-bar">
          <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={bulkDeleting} className="animate-in fade-in">
            <Trash2 size={14} className="mr-1" />
            {bulkDeleting ? "Deleting…" : `Delete (${selectedIds.size})`}
          </Button>
        </div>
      )}

      {/* Compact list view with expandable edit/delete */}
      {(() => {
        const pagedItems = paginateItems(filteredItems, page, pageSize);
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={pagedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                {/* Table header - desktop only */}
                <div className="hidden md:grid md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-2 bg-muted/40 text-xs font-medium text-muted-foreground">
                  <span className="w-10" />
                  <span>Title</span>
                  <span className="w-32">Category</span>
                  <span className="w-20 text-right">Size</span>
                  <span className="w-16 text-center">Status</span>
                  <span className="w-24 text-right">Actions</span>
                </div>

                {pagedItems.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No study materials found.</div>
                )}

                {pagedItems.map(item => {
                  const isEditing = expandedEditId === item.id;
                  const isDeleting = expandedDeleteId === item.id;

                  return (
                    <SortableItem key={item.id} id={item.id}>
                      <div className={`transition-colors ${selectedIds.has(item.id) ? "bg-primary/5" : ""} ${!item.is_active ? "opacity-60" : ""}`}>
                        {/* Compact row */}
                        <div className="px-4 py-3">
                          {/* Desktop row */}
                          <div className="hidden md:grid md:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-3 items-center">
                            <div className="w-10">
                              <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} />
                            </div>
                            <span className="text-sm font-medium text-foreground truncate">{item.title}</span>
                            <span className="w-32 text-xs text-muted-foreground truncate">{item.category}</span>
                            <span className="w-20 text-xs text-muted-foreground text-right">{item.file_size || "—"}</span>
                            <span className="w-16 text-center">
                              <ContentStatusBadge status={getContentStatus({ isActive: item.is_active, publishAt: (item as any).publish_at, expireAt: (item as any).expire_at })} />
                            </span>
                            <div className="w-24 flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant={isEditing ? "default" : "outline"}
                                className="h-7 px-2 text-xs"
                                onClick={() => { setExpandedEditId(isEditing ? null : item.id); setExpandedDeleteId(null); }}
                              >
                                <Pencil size={12} className="mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={isDeleting ? "destructive" : "outline"}
                                className="h-7 px-2 text-xs"
                                onClick={() => { setExpandedDeleteId(isDeleting ? null : item.id); setExpandedEditId(isEditing && !isDeleting ? null : expandedEditId); }}
                              >
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </div>

                          {/* Mobile row */}
                          <div className="md:hidden space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate flex-1">{item.title}</span>
                            </div>
                            <div className="flex items-center justify-between pl-6">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{item.category}</span>
                                <span>•</span>
                                <span>{item.file_size || "—"}</span>
                              </div>
                              <ContentStatusBadge status={getContentStatus({ isActive: item.is_active, publishAt: (item as any).publish_at, expireAt: (item as any).expire_at })} />
                              </span>
                            </div>
                            <div className="flex gap-2 pl-6">
                              <Button
                                size="sm"
                                variant={isEditing ? "default" : "outline"}
                                className="h-7 px-2 text-xs flex-1"
                                onClick={() => { setExpandedEditId(isEditing ? null : item.id); setExpandedDeleteId(null); }}
                              >
                                <Pencil size={12} className="mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant={isDeleting ? "destructive" : "outline"}
                                className="h-7 px-2 text-xs flex-1"
                                onClick={() => { setExpandedDeleteId(isDeleting ? null : item.id); setExpandedEditId(isEditing && !isDeleting ? null : expandedEditId); }}
                              >
                                <Trash2 size={12} className="mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded delete confirmation */}
                        {isDeleting && (
                          <div className="px-4 py-3 bg-destructive/5 border-t border-destructive/20">
                            <p className="text-sm text-foreground mb-2">Are you sure you want to delete this study material?</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setExpandedDeleteId(null)}>Cancel</Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => { remove(item.id); setExpandedDeleteId(null); }}>
                                <Trash2 size={12} className="mr-1" /> Confirm Delete
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Expanded edit form */}
                        {isEditing && (
                          <div className="px-4 py-4 bg-muted/20 border-t border-border space-y-3">
                            {/* PDF Upload area */}
                            <div
                              className={`relative border-2 border-dashed rounded-lg p-3 transition-colors ${
                                dragOverId === item.id ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
                              }`}
                              onDragOver={e => { e.preventDefault(); setDragOverId(item.id); }}
                              onDragLeave={() => setDragOverId(null)}
                              onDrop={e => { e.preventDefault(); setDragOverId(null); const file = e.dataTransfer.files?.[0]; if (file) handleFileUpload(item.id, file); }}
                            >
                              <input type="file" accept=".pdf" className="hidden" ref={el => { fileInputRefs.current[item.id] = el; }}
                                onChange={e => { const file = e.target.files?.[0]; if (file) handleFileUpload(item.id, file); e.target.value = ""; }} />
                              <div className="flex items-center gap-3">
                                <Button size="sm" variant="outline" className="h-8" disabled={uploadingId === item.id} onClick={() => fileInputRefs.current[item.id]?.click()}>
                                  {uploadingId === item.id
                                    ? <><Loader2 size={14} className="mr-1 animate-spin" /> Uploading...</>
                                    : <><Upload size={14} className="mr-1" /> Upload PDF</>}
                                </Button>
                                <span className="text-xs text-muted-foreground">or drag & drop a PDF here</span>
                              </div>
                              {uploadingId === item.id && <Progress value={uploadProgress} className="mt-2 h-2" />}
                            </div>

                            {/* Form fields */}
                            <div className="grid gap-2 sm:grid-cols-2">
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                                <Input ref={item.id === newItemId || expandedEditId === item.id ? newTitleRef : undefined} value={item.title} onChange={e => updateLocal(item.id, "title", e.target.value)} placeholder="Title" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                                <Select value={activeCategoryNames.includes(item.category) ? item.category : ""} onValueChange={v => updateLocal(item.id, "category", v)}>
                                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select category" /></SelectTrigger>
                                  <SelectContent>
                                    {activeCategories.map(cat => (
                                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                    ))}
                                    {!activeCategoryNames.includes(item.category) && item.category && (
                                      <SelectItem value={item.category}>{item.category} (inactive)</SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">File URL</label>
                                <Input value={item.file_url || ""} onChange={e => updateLocal(item.id, "file_url", e.target.value)} placeholder="Auto-filled on upload" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">File Size</label>
                                <Input value={item.file_size || ""} onChange={e => updateLocal(item.id, "file_size", e.target.value)} placeholder="Auto-detected" />
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Pages</label>
                                <Input type="number" value={item.pages || ""} onChange={e => updateLocal(item.id, "pages", e.target.value ? parseInt(e.target.value) : null)} placeholder="Auto-detected" />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-1.5 text-sm cursor-pointer h-9">
                                  <input type="checkbox" checked={item.is_active}
                                    onChange={async () => {
                                      const newVal = !item.is_active;
                                      updateLocal(item.id, "is_active", newVal);
                                      const { error } = await supabase.from("study_materials").update({ is_active: newVal }).eq("id", item.id);
                                      if (error) toast.error(error.message);
                                      else toast.success(newVal ? "Activated" : "Hidden from public site");
                                    }}
                                    className="accent-primary h-4 w-4"
                                  />
                                  <span className={item.is_active ? "text-foreground" : "text-muted-foreground"}>
                                    {item.is_active ? "Active" : "Inactive"}
                                  </span>
                                </label>
                              </div>
                            </div>

                            {/* SEO Overrides */}
                            <SeoFieldsPanel
                              values={{
                                seo_title: (item as any).seo_title, seo_description: (item as any).seo_description,
                                seo_keywords: (item as any).seo_keywords, seo_canonical_url: (item as any).seo_canonical_url,
                                seo_og_title: (item as any).seo_og_title, seo_og_description: (item as any).seo_og_description,
                                seo_og_image: (item as any).seo_og_image, seo_twitter_title: (item as any).seo_twitter_title,
                                seo_twitter_description: (item as any).seo_twitter_description, seo_twitter_image: (item as any).seo_twitter_image,
                              }}
                              onChange={(field, value) => updateLocal(item.id, field, value)}
                              defaultCanonical={`https://iqbalsir.bd/resources`}
                            />

                            {/* Save / Cancel */}
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => setExpandedEditId(null)}>Cancel</Button>
                              <Button size="sm" onClick={() => { update(item.id, {
                                title: item.title, category: item.category, file_url: item.file_url, file_size: item.file_size, pages: item.pages,
                                seo_title: (item as any).seo_title || null, seo_description: (item as any).seo_description || null,
                                seo_keywords: (item as any).seo_keywords || null, seo_canonical_url: (item as any).seo_canonical_url || null,
                                seo_og_title: (item as any).seo_og_title || null, seo_og_description: (item as any).seo_og_description || null,
                                seo_og_image: (item as any).seo_og_image || null, seo_twitter_title: (item as any).seo_twitter_title || null,
                                seo_twitter_description: (item as any).seo_twitter_description || null, seo_twitter_image: (item as any).seo_twitter_image || null,
                              } as any); setExpandedEditId(null); }}>
                                <Save size={14} className="mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </SortableItem>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        );
      })()}

      <div className="admin-pagination-footer pt-4">
        <AdminPagination
          total={filteredItems.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={s => { setPageSize(s); setPage(1); }}
        />
      </div>
    </div>
  );
};

export default AdminStudyMaterials;
