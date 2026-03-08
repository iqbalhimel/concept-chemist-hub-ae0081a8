import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Trash2, Copy, FileText, Image as ImageIcon } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { compressImage } from "@/lib/imageCompression";

type Media = Tables<"media_library">;

const AdminMediaLibrary = () => {
  const [items, setItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("media_library").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const { blob, wasCompressed } = isImage ? await compressImage(file) : { blob: file as Blob, wasCompressed: false };
      const ext = wasCompressed ? "jpg" : file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("media").upload(path, blob, {
        contentType: wasCompressed ? "image/jpeg" : file.type,
      });
      if (uploadError) { toast.error("Upload failed: " + uploadError.message); continue; }

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

      await supabase.from("media_library").insert({
        name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
      });
    }

    toast.success("Upload complete");
    setUploading(false);
    fetchAll();
    if (fileRef.current) fileRef.current.value = "";
  };

  const remove = async (item: Media) => {
    // Try to delete from storage too
    const urlParts = item.file_url.split("/media/");
    if (urlParts[1]) {
      await supabase.storage.from("media").remove([urlParts[1]]);
    }
    await supabase.from("media_library").delete().eq("id", item.id);
    setItems(prev => prev.filter(n => n.id !== item.id));
    toast.success("Deleted");
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied!");
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Media Library</h2>
        <div>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} size="sm" disabled={uploading}>
            <Upload size={14} className="mr-1" /> {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="glass-card p-3 space-y-2">
            {item.file_type.startsWith("image/") ? (
              <img src={item.file_url} alt={item.name} className="w-full h-32 object-cover rounded-lg bg-muted" />
            ) : (
              <div className="w-full h-32 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="text-muted-foreground" size={32} />
              </div>
            )}
            <p className="text-sm text-foreground truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.file_size ? `${(item.file_size / 1024).toFixed(1)} KB` : ""}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => copyUrl(item.file_url)}><Copy size={12} className="mr-1" /> Copy URL</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(item)}><Trash2 size={12} /></Button>
            </div>
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="text-muted-foreground text-center py-8">No media uploaded yet. Click Upload to add images or PDFs.</p>}
    </div>
  );
};

export default AdminMediaLibrary;
