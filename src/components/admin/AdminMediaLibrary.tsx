import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Trash2, Copy, FileText, Search } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { compressImage } from "@/lib/imageCompression";
import { secureUpload } from "@/lib/secureUpload";
import AdminPagination, { paginateItems } from "./AdminPagination";

type Media = Tables<"media_library">;

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
};

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    "image/jpeg": "JPG", "image/jpg": "JPG", "image/png": "PNG",
    "image/gif": "GIF", "image/webp": "WEBP", "image/svg+xml": "SVG",
    "application/pdf": "PDF",
  };
  return map[type] || type.split("/").pop()?.toUpperCase() || "FILE";
};

const AdminMediaLibrary = () => {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDeleteId, setExpandedDeleteId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("media_library").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.file_type.toLowerCase().includes(q) ||
      getTypeLabel(i.file_type).toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const paginated = useMemo(() => paginateItems(filtered, page, pageSize), [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [searchQuery, pageSize]);

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

        const { data: inserted } = await supabase.from("media_library").insert({
          name: file.name,
          file_url: publicUrl,
          file_type: finalType,
          file_size: blob.size,
        }).select().single();

        if (inserted) {
          setItems(prev => [inserted, ...prev]);
        }
      } catch (err: any) {
        toast.error(err.message || "Upload failed");
        continue;
      }
    }

    toast.success("Upload complete");
    setUploading(false);
    setPage(1);
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (item: Media) => {
    const urlParts = item.file_url.split("/media/");
    if (urlParts[1]) {
      await supabase.storage.from("media").remove([urlParts[1]]);
    }
    await supabase.from("media_library").delete().eq("id", item.id);
    setItems(prev => prev.filter(n => n.id !== item.id));
    setExpandedDeleteId(null);
    toast.success("Deleted");
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied");
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl font-bold text-foreground">Media Library</h2>
        <div>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} size="sm" disabled={uploading}>
            <Upload size={14} className="mr-1" /> {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search media files..."
          className="pl-9"
        />
      </div>

      {/* Pagination */}
      <AdminPagination
        total={filtered.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* List */}
      {paginated.length === 0 && (
        <p className="text-muted-foreground text-center py-8">
          {searchQuery ? "No files match your search." : "No media uploaded yet. Click Upload to add images or PDFs."}
        </p>
      )}

      {paginated.map(item => (
        <div key={item.id} className="glass-card p-3">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {item.file_type.startsWith("image/") ? (
              <img src={item.file_url} alt={item.name} className="w-10 h-10 object-cover rounded bg-muted flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="text-muted-foreground" size={18} />
              </div>
            )}
            <span className="flex-1 text-sm font-medium text-foreground truncate">{item.name}</span>
            <span className="text-xs text-muted-foreground w-12 text-center">{getTypeLabel(item.file_type)}</span>
            <span className="text-xs text-muted-foreground w-20 text-right">{formatSize(item.file_size)}</span>
            <span className="text-xs text-muted-foreground w-24 text-right">{formatDate(item.created_at)}</span>
            <div className="flex gap-1 flex-shrink-0">
              <Button size="sm" variant="ghost" onClick={() => copyUrl(item.file_url)}><Copy size={14} /></Button>
              <Button size="sm" variant="ghost" onClick={() => setExpandedDeleteId(expandedDeleteId === item.id ? null : item.id)}><Trash2 size={14} /></Button>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-2">
            <div className="flex items-center gap-3">
              {item.file_type.startsWith("image/") ? (
                <img src={item.file_url} alt={item.name} className="w-10 h-10 object-cover rounded bg-muted flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="text-muted-foreground" size={18} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatSize(item.file_size)} · {getTypeLabel(item.file_type)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => copyUrl(item.file_url)}><Copy size={12} className="mr-1" /> Copy URL</Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setExpandedDeleteId(expandedDeleteId === item.id ? null : item.id)}><Trash2 size={12} className="mr-1" /> Delete</Button>
            </div>
          </div>

          {/* Delete confirmation */}
          {expandedDeleteId === item.id && (
            <div className="mt-3 pt-3 border-t border-destructive/30 space-y-2">
              <p className="text-sm text-destructive">Are you sure you want to delete this media file?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setExpandedDeleteId(null)}>Cancel</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(item)}>Confirm Delete</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminMediaLibrary;
