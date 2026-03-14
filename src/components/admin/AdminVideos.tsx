import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Video, Save, X, Search, ArrowUpDown, ArrowUp, ArrowDown, ListFilter, GripVertical } from "lucide-react";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";
import { Badge } from "@/components/ui/badge";
import { secureUpload } from "@/lib/secureUpload";
import { compressImage } from "@/lib/imageCompression";
import { useVideoMetadataSync } from "@/hooks/useVideoMetadataSync";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminPagination, { paginateItems } from "@/components/admin/AdminPagination";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

type VideoItem = {
  id: string;
  title: string;
  description: string;
  subject: string;
  class_level: string;
  thumbnail_url: string | null;
  video_source: string;
  video_url: string | null;
  duration: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const emptyVideo: Omit<VideoItem, "id" | "created_at" | "updated_at"> = {
  title: "", description: "", subject: "", class_level: "",
  thumbnail_url: null, video_source: "youtube", video_url: "",
  duration: "", is_published: false, sort_order: 0,
};

type SortKey = "title" | "subject" | "class_level" | "video_source" | "created_at" | "is_published" | "sort_order";
type SortDir = "asc" | "desc";

// Sortable wrapper for table rows
const SortableTableRow = ({ id, children }: { id: string; children: (listeners: Record<string, any>) => React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return <TableRow ref={setNodeRef} style={style} {...attributes}>{children(listeners ?? {})}</TableRow>;
};

// Sortable wrapper for mobile cards
const SortableCard = ({ id, children }: { id: string; children: (listeners: any) => React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return <div ref={setNodeRef} style={style} {...attributes}>{children(listeners)}</div>;
};

const AdminVideos = () => {
  const csrfGuard = useCsrfGuard();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyVideo);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { syncFromUrl } = useVideoMetadataSync(setForm);

  // Search, filter, sort, pagination
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [orderChanged, setOrderChanged] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);

  // Selection & bulk
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDialog, setBulkDialog] = useState<{ action: "delete" | "publish" | "unpublish" } | null>(null);

  const handleVideoUrlChange = async (url: string) => {
    setForm(p => ({ ...p, video_url: url }));
    if (url.trim() && form.video_source !== "upload") {
      setSyncing(true);
      await syncFromUrl(url, form.video_source);
      setSyncing(false);
    }
  };

  const fetchVideos = async () => {
    const { data } = await supabase.from("educational_videos").select("*").order("created_at", { ascending: false });
    if (data) setVideos(data as VideoItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchVideos(); }, []);

  // Derived unique subjects & class levels for filters
  const subjects = useMemo(() => [...new Set(videos.map(v => v.subject).filter(Boolean))].sort(), [videos]);
  const classLevels = useMemo(() => [...new Set(videos.map(v => v.class_level).filter(Boolean))].sort(), [videos]);

  // Filtered + sorted list
  const processedVideos = useMemo(() => {
    let list = [...videos];
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.subject.toLowerCase().includes(q) ||
        v.class_level.toLowerCase().includes(q)
      );
    }
    // Filters
    if (filterSubject !== "all") list = list.filter(v => v.subject === filterSubject);
    if (filterClass !== "all") list = list.filter(v => v.class_level === filterClass);
    // Sort
    list.sort((a, b) => {
      let av: string | number | boolean = a[sortKey];
      let bv: string | number | boolean = b[sortKey];
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [videos, search, filterSubject, filterClass, sortKey, sortDir]);

  const paginatedVideos = useMemo(() => paginateItems(processedVideos, page, pageSize), [processedVideos, page, pageSize]);

  // Reset page on filter/search change
  useEffect(() => { setPage(1); }, [search, filterSubject, filterClass, sortKey, sortDir]);

  // Clear selection when videos change
  useEffect(() => { setSelected(new Set()); }, [videos]);

  const resetForm = () => { setForm(emptyVideo); setEditingId(null); setIsAdding(false); };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={14} className="ml-1 text-muted-foreground/50" />;
    return sortDir === "asc" ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />;
  };

  // Selection helpers
  const toggleSelect = (id: string) => setSelected(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });
  const allOnPageSelected = paginatedVideos.length > 0 && paginatedVideos.every(v => selected.has(v.id));
  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected(prev => {
        const s = new Set(prev);
        paginatedVideos.forEach(v => s.delete(v.id));
        return s;
      });
    } else {
      setSelected(prev => {
        const s = new Set(prev);
        paginatedVideos.forEach(v => s.add(v.id));
        return s;
      });
    }
  };

  // CRUD
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const result = await secureUpload(compressed.blob, compressed.contentType, file.name, { directory: "video-thumbnails" });
      setForm(prev => ({ ...prev, thumbnail_url: result.publicUrl }));
      toast.success("Thumbnail uploaded");
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    setUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast.error("Video must be under 50MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `video-uploads/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
      setForm(prev => ({ ...prev, video_url: urlData.publicUrl, video_source: "upload" }));
      toast.success("Video uploaded");
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    await csrfGuard(async () => {
      if (editingId) {
        const { error } = await supabase.from("educational_videos").update({ ...form, updated_at: new Date().toISOString() }).eq("id", editingId);
        if (error) { toast.error(error.message); return; }
        toast.success("Video updated");
      } else {
        const { error } = await supabase.from("educational_videos").insert(form as any);
        if (error) { toast.error(error.message); return; }
        toast.success("Video added");
      }
      resetForm();
      fetchVideos();
    }, "content_update", editingId ? "Updated educational video" : "Added educational video");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    await csrfGuard(async () => {
      const { error } = await supabase.from("educational_videos").delete().eq("id", id);
      if (error) { toast.error(error.message); return; }
      toast.success("Video deleted");
      fetchVideos();
    }, "content_delete", "Deleted educational video");
  };

  const togglePublish = async (video: VideoItem) => {
    await csrfGuard(async () => {
      const { error } = await supabase.from("educational_videos")
        .update({ is_published: !video.is_published, updated_at: new Date().toISOString() })
        .eq("id", video.id);
      if (error) { toast.error(error.message); return; }
      toast.success(video.is_published ? "Unpublished" : "Published");
      fetchVideos();
    }, "content_update", `${video.is_published ? "Unpublished" : "Published"} video: ${video.title}`);
  };

  const startEdit = (video: VideoItem) => {
    setForm({
      title: video.title, description: video.description, subject: video.subject,
      class_level: video.class_level, thumbnail_url: video.thumbnail_url,
      video_source: video.video_source, video_url: video.video_url,
      duration: video.duration, is_published: video.is_published, sort_order: video.sort_order,
    });
    setEditingId(video.id);
    setIsAdding(true);
  };

  // Bulk actions
  const executeBulk = async () => {
    if (!bulkDialog || selected.size === 0) return;
    const ids = [...selected];
    await csrfGuard(async () => {
      if (bulkDialog.action === "delete") {
        const { error } = await supabase.from("educational_videos").delete().in("id", ids);
        if (error) { toast.error(error.message); return; }
        toast.success(`Deleted ${ids.length} video(s)`);
      } else {
        const pub = bulkDialog.action === "publish";
        const { error } = await supabase.from("educational_videos")
          .update({ is_published: pub, updated_at: new Date().toISOString() })
          .in("id", ids);
        if (error) { toast.error(error.message); return; }
        toast.success(`${pub ? "Published" : "Unpublished"} ${ids.length} video(s)`);
      }
      setBulkDialog(null);
      setSelected(new Set());
      fetchVideos();
    }, "content_update", `Bulk ${bulkDialog.action} ${ids.length} videos`);
  };

  const sourceLabel = (s: string) => s === "youtube" ? "YouTube" : s === "google_drive" ? "Google Drive" : "Upload";

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{processedVideos.length} video(s){search || filterSubject !== "all" || filterClass !== "all" ? ` (filtered from ${videos.length})` : ""}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ListFilter size={14} className="mr-1" /> Bulk ({selected.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setBulkDialog({ action: "publish" })}>Publish Selected</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBulkDialog({ action: "unpublish" })}>Unpublish Selected</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => setBulkDialog({ action: "delete" })}>Delete Selected</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {!isAdding && <Button size="sm" onClick={() => { resetForm(); setIsAdding(true); }}><Plus size={14} className="mr-1" /> Add Video</Button>}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_auto_auto] gap-2">
        <div className="relative sm:col-span-2 md:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search title, subject, class…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Subject" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Class Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {classLevels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile sort control */}
      <div className="md:hidden flex items-center gap-2">
        <Checkbox checked={allOnPageSelected} onCheckedChange={toggleSelectAll} />
        <span className="text-xs text-muted-foreground">Select all</span>
        <div className="ml-auto">
          <Select value={`${sortKey}:${sortDir}`} onValueChange={v => { const [k, d] = v.split(":"); setSortKey(k as SortKey); setSortDir(d as SortDir); }}>
            <SelectTrigger className="h-8 text-xs w-[150px]"><ArrowUpDown size={12} className="mr-1 shrink-0" /><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at:desc">Newest first</SelectItem>
              <SelectItem value="created_at:asc">Oldest first</SelectItem>
              <SelectItem value="title:asc">Title A–Z</SelectItem>
              <SelectItem value="title:desc">Title Z–A</SelectItem>
              <SelectItem value="subject:asc">Subject A–Z</SelectItem>
              <SelectItem value="is_published:desc">Published first</SelectItem>
              <SelectItem value="is_published:asc">Drafts first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{editingId ? "Edit Video" : "Add Video"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Video Title *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Introduction to Organic Chemistry" /></div>
              <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="e.g. Chemistry" /></div>
              <div><Label>Class Level</Label><Input value={form.class_level} onChange={e => setForm(p => ({ ...p, class_level: e.target.value }))} placeholder="e.g. HSC" /></div>
              <div><Label>Duration</Label><Input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 12:30" /></div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} /></div>
            <div>
              <Label>Thumbnail {form.video_source === "upload" ? "*" : "(auto-synced)"}</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="w-24 h-14 object-cover rounded border border-border" />}
                <Input type="file" accept="image/*" onChange={handleThumbnailUpload} disabled={uploading} className="min-w-0" />
              </div>
              {form.video_source !== "upload" && !form.thumbnail_url && <p className="text-xs text-muted-foreground mt-1">Paste a video URL below to auto-fetch thumbnail</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Video Source</Label>
                <Select value={form.video_source} onValueChange={v => setForm(p => ({ ...p, video_source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="google_drive">Google Drive</SelectItem>
                    <SelectItem value="upload">Upload (MP4/WebM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                {form.video_source === "upload" ? (
                  <><Label>Upload Video</Label><Input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} disabled={uploading} className="min-w-0" /></>
                ) : (
                  <><Label>Video URL</Label><Input value={form.video_url || ""} onChange={e => handleVideoUrlChange(e.target.value)} placeholder={form.video_source === "youtube" ? "YouTube URL" : "Google Drive share link"} />
                  {syncing && <p className="text-xs text-primary mt-1 animate-pulse">Syncing metadata…</p>}</>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} id="published" />
              <Label htmlFor="published">Published</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={uploading}><Save size={14} className="mr-1" /> {editingId ? "Update" : "Save"}</Button>
              <Button variant="outline" onClick={resetForm}><X size={14} className="mr-1" /> Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Videos List */}
      {processedVideos.length > 0 ? (
        <>
          {/* Desktop table — only on md+ */}
          <div className="hidden md:block rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"><Checkbox checked={allOnPageSelected} onCheckedChange={toggleSelectAll} /></TableHead>
                  <TableHead className="w-16">Thumb</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("title")}>
                    <span className="inline-flex items-center">Title<SortIcon col="title" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("subject")}>
                    <span className="inline-flex items-center">Subject<SortIcon col="subject" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("class_level")}>
                    <span className="inline-flex items-center">Class<SortIcon col="class_level" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("video_source")}>
                    <span className="inline-flex items-center">Source<SortIcon col="video_source" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                    <span className="inline-flex items-center">Date<SortIcon col="created_at" /></span>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("is_published")}>
                    <span className="inline-flex items-center">Status<SortIcon col="is_published" /></span>
                  </TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVideos.map(video => (
                  <TableRow key={video.id} data-state={selected.has(video.id) ? "selected" : undefined}>
                    <TableCell><Checkbox checked={selected.has(video.id)} onCheckedChange={() => toggleSelect(video.id)} /></TableCell>
                    <TableCell>
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt="" className="w-14 h-9 object-cover rounded" />
                      ) : (
                        <div className="w-14 h-9 rounded bg-muted flex items-center justify-center"><Video size={14} className="text-muted-foreground/40" /></div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{video.title}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{video.subject || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{video.class_level || "—"}</TableCell>
                    <TableCell className="text-xs">{sourceLabel(video.video_source)}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(video.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={video.is_published ? "default" : "secondary"} className="cursor-pointer" onClick={() => togglePublish(video)}>
                        {video.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(video)}><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(video.id)}><Trash2 size={14} className="text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile & Tablet cards — below md */}
          <div className="md:hidden space-y-2">
            {paginatedVideos.map(video => (
              <Card key={video.id} className="overflow-hidden" data-state={selected.has(video.id) ? "selected" : undefined}>
                <div className="flex gap-3 p-3 min-w-0">
                  <Checkbox checked={selected.has(video.id)} onCheckedChange={() => toggleSelect(video.id)} className="mt-1 shrink-0" />
                  <div className="w-16 h-11 sm:w-20 sm:h-14 rounded overflow-hidden bg-muted shrink-0">
                    {video.thumbnail_url ? <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Video size={16} className="text-muted-foreground/40" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground truncate">{video.title}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <Badge variant={video.is_published ? "default" : "secondary"} className="text-[10px] cursor-pointer" onClick={() => togglePublish(video)}>
                        {video.is_published ? "Published" : "Draft"}
                      </Badge>
                      {video.subject && <span className="text-[10px] text-muted-foreground">{video.subject}</span>}
                      {video.class_level && <span className="text-[10px] text-muted-foreground">• {video.class_level}</span>}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {sourceLabel(video.video_source)} • {new Date(video.created_at).toLocaleDateString()}
                        {video.duration && ` • ${video.duration}`}
                      </span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(video)}><Edit2 size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(video.id)}><Trash2 size={12} className="text-destructive" /></Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <AdminPagination total={processedVideos.length} page={page} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
        </>
      ) : (
        <p className="text-center text-muted-foreground py-10">
          {videos.length === 0 ? 'No videos yet. Click "Add Video" to get started.' : "No videos match your search/filters."}
        </p>
      )}

      {/* Bulk Action Confirmation */}
      <AlertDialog open={!!bulkDialog} onOpenChange={open => !open && setBulkDialog(null)}>
        <AlertDialogContent className="max-w-[calc(100vw-2rem)]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkDialog?.action === "delete" ? "Delete Selected Videos?" : bulkDialog?.action === "publish" ? "Publish Selected Videos?" : "Unpublish Selected Videos?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkDialog?.action === "delete"
                ? `This will permanently delete ${selected.size} video(s). This action cannot be undone.`
                : `This will ${bulkDialog?.action} ${selected.size} video(s).`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulk} className={bulkDialog?.action === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVideos;
