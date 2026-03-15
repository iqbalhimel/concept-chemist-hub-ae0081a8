import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload, Trash2, Search, FolderInput, Tag, X, Grid3X3, List, ChevronLeft,
} from "lucide-react";
import { compressImage } from "@/lib/imageCompression";
import { logSecurityEvent } from "@/lib/securityLogger";
import { logAdminActivity } from "@/lib/activityLogger";
import { secureUpload } from "@/lib/secureUpload";
import AdminPagination, { paginateItems } from "./AdminPagination";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import { useMediaUsage } from "@/hooks/useMediaUsage";
import MediaFolderSidebar from "./media/MediaFolderSidebar";
import MediaDetailsPanel from "./media/MediaDetailsPanel";
import MediaGrid from "./media/MediaGrid";

// Extended media type with new columns
interface MediaItem {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
  uploaded_by: string | null;
  folder: string;
  tags: string[];
}

const DEFAULT_FOLDER = "Uncategorized";
const PRESET_FOLDERS = ["Uncategorized", "Blog Images", "Study Materials", "Hero Images", "Testimonials"];

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    "image/jpeg": "JPG", "image/jpg": "JPG", "image/png": "PNG",
    "image/gif": "GIF", "image/webp": "WEBP", "image/svg+xml": "SVG",
    "application/pdf": "PDF",
  };
  return map[type] || type.split("/").pop()?.toUpperCase() || "FILE";
};

const AdminMediaLibrary = () => {
  const csrfGuard = useCsrfGuard();
  const { usageMap, usageLoading, refreshUsage } = useMediaUsage();

  // Data
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>("__all__");
  const [filterType, setFilterType] = useState<string>("__all__");

  // UI state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFolders, setShowFolders] = useState(true);

  // Bulk actions
  const [bulkAction, setBulkAction] = useState<string>("__none__");
  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkFolderTarget, setBulkFolderTarget] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase
      .from("media_library")
      .select("*")
      .order("created_at", { ascending: false });

    // Map to MediaItem, handling potential missing columns gracefully
    const mapped: MediaItem[] = (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      file_url: d.file_url,
      file_type: d.file_type,
      file_size: d.file_size,
      created_at: d.created_at,
      uploaded_by: d.uploaded_by,
      folder: d.folder || DEFAULT_FOLDER,
      tags: Array.isArray(d.tags) ? d.tags : [],
    }));

    setItems(mapped);
    setLoading(false);
  };

  // ─── Derived data ───
  const allFolders = useMemo(() => {
    const fromItems = items.map(i => i.folder);
    const merged = new Set([...PRESET_FOLDERS, ...fromItems]);
    return Array.from(merged).sort((a, b) => {
      if (a === DEFAULT_FOLDER) return -1;
      if (b === DEFAULT_FOLDER) return 1;
      return a.localeCompare(b);
    });
  }, [items]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(i => { counts[i.folder] = (counts[i.folder] || 0) + 1; });
    return counts;
  }, [items]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    items.forEach(i => i.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [items]);

  const usageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(usageMap).forEach(([url, refs]) => { counts[url] = refs.length; });
    return counts;
  }, [usageMap]);

  const filtered = useMemo(() => {
    let result = items;

    // Folder filter
    if (activeFolder !== null) {
      result = result.filter(i => i.folder === activeFolder);
    }

    // Tag filter
    if (filterTag !== "__all__") {
      result = result.filter(i => i.tags.includes(filterTag));
    }

    // Type filter
    if (filterType !== "__all__") {
      result = result.filter(i => getTypeLabel(i.file_type) === filterType);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.tags.some(t => t.includes(q)) ||
        i.folder.toLowerCase().includes(q) ||
        i.file_type.toLowerCase().includes(q)
      );
    }

    return result;
  }, [items, activeFolder, filterTag, filterType, searchQuery]);

  const paginated = useMemo(() => paginateItems(filtered, page, pageSize), [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [searchQuery, activeFolder, filterTag, filterType, pageSize]);

  // ─── Selection ───
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = () => {
    const allIds = paginated.map(i => i.id);
    const allSelected = allIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      allIds.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  // ─── Upload ───
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const isImage = file.type.startsWith("image/");
        const { blob, wasCompressed, contentType } = isImage
          ? await compressImage(file)
          : { blob: file as Blob, wasCompressed: false, contentType: file.type };
        const finalType = wasCompressed ? "image/jpeg" : contentType;

        const { publicUrl } = await secureUpload(blob, finalType, file.name, { directory: "media" });

        const insertData: any = {
          name: file.name,
          file_url: publicUrl,
          file_type: finalType,
          file_size: blob.size,
          folder: activeFolder || DEFAULT_FOLDER,
          tags: [],
        };

        const { data: inserted } = await supabase.from("media_library").insert(insertData).select().single();

        if (inserted) {
          setItems(prev => [{
            ...inserted as any,
            folder: (inserted as any).folder || DEFAULT_FOLDER,
            tags: Array.isArray((inserted as any).tags) ? (inserted as any).tags : [],
          }, ...prev]);
        }
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
      }
    }
    logSecurityEvent({ event_type: "file_upload", description: `Uploaded ${files.length} file(s)` });
    for (const file of Array.from(files)) {
      logAdminActivity({ action: "upload", module: "media_library", itemTitle: file.name });
    }
    toast.success("Upload complete");
    setUploading(false);
    setPage(1);
    if (fileRef.current) fileRef.current.value = "";
    refreshUsage();
  };

  // ─── Delete ───
  const removeItem = async (item: MediaItem) => {
    const refs = usageMap[item.file_url] || [];
    if (refs.length > 0) {
      const confirm = window.confirm(
        `This file is used in ${refs.length} place(s):\n${refs.map(r => `• ${r.source}: ${r.title}`).join("\n")}\n\nDelete anyway?`
      );
      if (!confirm) return;
    }
    await csrfGuard(async () => {
      const urlParts = item.file_url.split("/media/");
      if (urlParts[1]) await supabase.storage.from("media").remove([urlParts[1]]);
      await supabase.from("media_library").delete().eq("id", item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      if (activeDetailId === item.id) setActiveDetailId(null);
      toast.success("Deleted");
    }, "content_delete", `Deleted media: ${item.name}`);
  };

  // ─── Bulk actions ───
  const executeBulkAction = async () => {
    if (selectedIds.size === 0) return;
    const selected = items.filter(i => selectedIds.has(i.id));

    if (bulkAction === "delete") {
      const usedItems = selected.filter(i => (usageMap[i.file_url]?.length || 0) > 0);
      if (usedItems.length > 0) {
        const confirm = window.confirm(
          `${usedItems.length} of ${selected.length} files are currently used in content. Delete all anyway?`
        );
        if (!confirm) return;
      }
      setBulkDeleting(true);
      await csrfGuard(async () => {
        const storagePaths = selected
          .map(i => { const parts = i.file_url.split("/media/"); return parts[1] || null; })
          .filter(Boolean) as string[];
        if (storagePaths.length) await supabase.storage.from("media").remove(storagePaths);
        await supabase.from("media_library").delete().in("id", selected.map(i => i.id));
        setItems(prev => prev.filter(i => !selectedIds.has(i.id)));
        logSecurityEvent({ event_type: "content_delete", description: `Bulk deleted ${selected.length} media` });
        toast.success(`Deleted ${selected.length} file(s)`);
        setSelectedIds(new Set());
        setBulkDeleting(false);
        refreshUsage();
      }, "content_delete", `Bulk deleted ${selected.length} media`);
    } else if (bulkAction === "move" && bulkFolderTarget) {
      await Promise.all(selected.map(i =>
        supabase.from("media_library").update({ folder: bulkFolderTarget } as any).eq("id", i.id)
      ));
      setItems(prev => prev.map(i =>
        selectedIds.has(i.id) ? { ...i, folder: bulkFolderTarget } : i
      ));
      toast.success(`Moved ${selected.length} file(s) to ${bulkFolderTarget}`);
      setSelectedIds(new Set());
    } else if (bulkAction === "add-tag" && bulkTagInput.trim()) {
      const tag = bulkTagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      await Promise.all(selected.map(i => {
        const newTags = Array.from(new Set([...i.tags, tag]));
        return supabase.from("media_library").update({ tags: newTags } as any).eq("id", i.id);
      }));
      setItems(prev => prev.map(i =>
        selectedIds.has(i.id) ? { ...i, tags: Array.from(new Set([...i.tags, tag])) } : i
      ));
      toast.success(`Added tag "${tag}" to ${selected.length} file(s)`);
      setBulkTagInput("");
      setSelectedIds(new Set());
    } else if (bulkAction === "remove-tag" && bulkTagInput.trim()) {
      const tag = bulkTagInput.trim().toLowerCase();
      await Promise.all(selected.map(i => {
        const newTags = i.tags.filter(t => t !== tag);
        return supabase.from("media_library").update({ tags: newTags } as any).eq("id", i.id);
      }));
      setItems(prev => prev.map(i =>
        selectedIds.has(i.id) ? { ...i, tags: i.tags.filter(t => t !== tag) } : i
      ));
      toast.success(`Removed tag "${tag}" from ${selected.length} file(s)`);
      setBulkTagInput("");
      setSelectedIds(new Set());
    }
    setBulkAction("__none__");
  };

  // ─── Item metadata updates ───
  const updateItemFolder = async (id: string, folder: string) => {
    await supabase.from("media_library").update({ folder } as any).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, folder } : i));
    toast.success(`Moved to ${folder}`);
  };

  const addItemTag = async (id: string, tag: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newTags = Array.from(new Set([...item.tags, tag]));
    await supabase.from("media_library").update({ tags: newTags } as any).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, tags: newTags } : i));
  };

  const removeItemTag = async (id: string, tag: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newTags = item.tags.filter(t => t !== tag);
    await supabase.from("media_library").update({ tags: newTags } as any).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, tags: newTags } : i));
  };

  // ─── Folder management ───
  const addFolder = (name: string) => {
    if (allFolders.includes(name)) {
      toast.error("Folder already exists");
      return;
    }
    // Folders are derived from items + presets; adding a folder with no items
    // just means we set the state to display it. We'll force by adding to presets via moving an item.
    // For now, just select the folder — it will appear in the sidebar.
    toast.success(`Folder "${name}" created`);
    setActiveFolder(name);
  };

  const renameFolder = async (oldName: string, newName: string) => {
    if (oldName === DEFAULT_FOLDER) {
      toast.error("Cannot rename Uncategorized");
      return;
    }
    if (allFolders.includes(newName)) {
      toast.error("Folder name already exists");
      return;
    }
    // Update all items in that folder
    const inFolder = items.filter(i => i.folder === oldName);
    if (inFolder.length > 0) {
      await Promise.all(inFolder.map(i =>
        supabase.from("media_library").update({ folder: newName } as any).eq("id", i.id)
      ));
    }
    setItems(prev => prev.map(i => i.folder === oldName ? { ...i, folder: newName } : i));
    if (activeFolder === oldName) setActiveFolder(newName);
    toast.success(`Renamed to "${newName}"`);
  };

  const deleteFolder = (name: string) => {
    if (name === DEFAULT_FOLDER) return;
    const count = folderCounts[name] || 0;
    if (count > 0) {
      toast.error("Folder is not empty");
      return;
    }
    if (activeFolder === name) setActiveFolder(null);
    toast.success(`Folder "${name}" removed`);
  };

  const activeItem = activeDetailId ? items.find(i => i.id === activeDetailId) : null;

  if (loading) return <div className="text-muted-foreground p-4">Loading media library...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mt-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Media Manager <span className="text-base font-normal text-muted-foreground">({items.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex border border-border rounded-md overflow-hidden">
            <button
              className={`px-2 py-1 text-xs ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              className={`px-2 py-1 text-xs ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setViewMode("list")}
            >
              <List size={14} />
            </button>
          </div>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} size="sm" disabled={uploading}>
            <Upload size={14} className="mr-1" /> {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {/* Main layout: sidebar + content */}
      <div className="flex gap-4">
        {/* Folder sidebar — collapsible on mobile */}
        {showFolders && (
          <div className="w-full md:w-48 lg:w-56 shrink-0 md:block">
            <div className="border border-border rounded-lg p-3 bg-card">
              <MediaFolderSidebar
                folders={allFolders}
                activeFolder={activeFolder}
                folderCounts={folderCounts}
                totalCount={items.length}
                onSelect={setActiveFolder}
                onAddFolder={addFolder}
                onRenameFolder={renameFolder}
                onDeleteFolder={deleteFolder}
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 w-full text-xs md:hidden"
              onClick={() => setShowFolders(false)}
            >
              <ChevronLeft size={12} className="mr-1" /> Hide Folders
            </Button>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Mobile folder toggle */}
          {!showFolders && (
            <Button size="sm" variant="outline" className="md:hidden text-xs" onClick={() => setShowFolders(true)}>
              Folders
            </Button>
          )}

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search files, tags, folders..."
                className="pl-9 h-9"
              />
              {searchQuery && (
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {allTags.length > 0 && (
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-32 h-9 text-xs"><SelectValue placeholder="Tag" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Tags</SelectItem>
                    {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-28 h-9 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Types</SelectItem>
                  <SelectItem value="JPG">JPG</SelectItem>
                  <SelectItem value="PNG">PNG</SelectItem>
                  <SelectItem value="WEBP">WEBP</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="GIF">GIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters display */}
          {(activeFolder || filterTag !== "__all__" || filterType !== "__all__") && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Filters:</span>
              {activeFolder && (
                <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => setActiveFolder(null)}>
                  📁 {activeFolder} <X size={10} />
                </Badge>
              )}
              {filterTag !== "__all__" && (
                <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => setFilterTag("__all__")}>
                  🏷 {filterTag} <X size={10} />
                </Badge>
              )}
              {filterType !== "__all__" && (
                <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => setFilterType("__all__")}>
                  {filterType} <X size={10} />
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-1">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
            </div>
          )}

          {/* Select All */}
          {paginated.length > 0 && (
            <div className="admin-select-all">
              <Checkbox
                checked={paginated.every(i => selectedIds.has(i.id))}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-xs text-muted-foreground">
                {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
              </span>
            </div>
          )}

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="admin-bulk-bar flex-wrap">
              <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Bulk action..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Choose action</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="move">Move to folder</SelectItem>
                    <SelectItem value="add-tag">Add tag</SelectItem>
                    <SelectItem value="remove-tag">Remove tag</SelectItem>
                  </SelectContent>
                </Select>

                {bulkAction === "move" && (
                  <Select value={bulkFolderTarget} onValueChange={setBulkFolderTarget}>
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Select folder" /></SelectTrigger>
                    <SelectContent>
                      {allFolders.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}

                {(bulkAction === "add-tag" || bulkAction === "remove-tag") && (
                  <Input
                    className="h-8 w-32 text-xs"
                    placeholder="Tag name..."
                    value={bulkTagInput}
                    onChange={e => setBulkTagInput(e.target.value)}
                  />
                )}

                <Button
                  size="sm"
                  variant={bulkAction === "delete" ? "destructive" : "default"}
                  className="h-8 text-xs"
                  disabled={bulkAction === "__none__" || bulkDeleting || (bulkAction === "move" && !bulkFolderTarget) || ((bulkAction === "add-tag" || bulkAction === "remove-tag") && !bulkTagInput.trim())}
                  onClick={executeBulkAction}
                >
                  {bulkDeleting ? "Deleting..." : "Apply"}
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {paginated.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <Upload size={40} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {searchQuery || activeFolder || filterTag !== "__all__" || filterType !== "__all__"
                  ? "No files match your filters."
                  : "No media uploaded yet. Click Upload to get started."}
              </p>
            </div>
          ) : (
            <div className="flex gap-4">
              {/* Grid/List */}
              <div className="flex-1 min-w-0">
                {viewMode === "grid" ? (
                  <MediaGrid
                    items={paginated}
                    selectedIds={selectedIds}
                    activeDetailId={activeDetailId}
                    onToggleSelect={toggleSelect}
                    onOpenDetails={id => setActiveDetailId(activeDetailId === id ? null : id)}
                    usageCounts={usageCounts}
                  />
                ) : (
                  /* List view */
                  <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                    {paginated.map(item => {
                      const isImage = item.file_type.startsWith("image/");
                      const isSelected = selectedIds.has(item.id);
                      const useCount = usageCounts[item.file_url] || 0;

                      return (
                        <div
                          key={item.id}
                          className={`admin-row flex items-center gap-3 px-3 py-2 cursor-pointer ${isSelected ? "selected" : ""} ${activeDetailId === item.id ? "bg-primary/5" : ""}`}
                          onClick={() => setActiveDetailId(activeDetailId === item.id ? null : item.id)}
                        >
                          <div onClick={e => e.stopPropagation()}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(item.id)} />
                          </div>
                          {isImage ? (
                            <img src={item.file_url} alt={item.name} className="w-8 h-8 object-cover rounded bg-muted shrink-0" loading="lazy" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-bold text-muted-foreground">{getTypeLabel(item.file_type)}</span>
                            </div>
                          )}
                          <span className="flex-1 text-sm text-foreground truncate min-w-0">{item.name}</span>
                          <div className="hidden sm:flex items-center gap-1">
                            {item.tags.slice(0, 2).map(t => (
                              <Badge key={t} variant="outline" className="text-[9px] px-1 py-0">{t}</Badge>
                            ))}
                          </div>
                          {useCount > 0 && (
                            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">
                              {useCount}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:inline">{item.folder}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Details panel — desktop inline */}
              {activeItem && (
                <div className="hidden lg:block w-72 shrink-0">
                  <div className="sticky top-14">
                    <MediaDetailsPanel
                      item={activeItem}
                      folders={allFolders}
                      usageRefs={usageMap[activeItem.file_url] || []}
                      onClose={() => setActiveDetailId(null)}
                      onUpdateFolder={updateItemFolder}
                      onAddTag={addItemTag}
                      onRemoveTag={removeItemTag}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Details panel — mobile/tablet (below content) */}
          {activeItem && (
            <div className="lg:hidden">
              <MediaDetailsPanel
                item={activeItem}
                folders={allFolders}
                usageRefs={usageMap[activeItem.file_url] || []}
                onClose={() => setActiveDetailId(null)}
                onUpdateFolder={updateItemFolder}
                onAddTag={addItemTag}
                onRemoveTag={removeItemTag}
              />
            </div>
          )}

          {/* Pagination */}
          <div className="admin-pagination-footer pt-4">
            <AdminPagination
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMediaLibrary;
