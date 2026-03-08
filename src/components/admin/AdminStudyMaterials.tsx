import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Tables } from "@/integrations/supabase/types";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

type Material = Tables<"study_materials">;

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const AdminStudyMaterials = () => {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from("study_materials").select("*").order("sort_order");
    setItems(data || []);
    setLoading(false);
  };

  const add = async () => {
    const { error } = await supabase.from("study_materials").insert({ title: "New Material", category: "Physics" });
    if (error) { toast.error(error.message); return; }
    toast.success("Added");
    fetchItems();
  };

  const update = async (id: string, updates: Partial<Material>) => {
    const { error } = await supabase.from("study_materials").update(updates).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Updated");
  };

  const remove = async (id: string) => {
    await supabase.from("study_materials").delete().eq("id", id);
    setItems(prev => prev.filter(n => n.id !== id));
    toast.success("Deleted");
  };

  const updateLocal = (id: string, field: string, value: string | number | null) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const handleFileUpload = async (id: string, file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }

    setUploadingId(id);
    setUploadProgress(10);

    // Extract metadata from PDF
    let pageCount: number | null = null;
    const fileSize = formatFileSize(file.size);

    try {
      setUploadProgress(20);
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pageCount = pdf.numPages;
      setUploadProgress(40);
    } catch (err) {
      console.warn("Could not extract PDF metadata:", err);
    }

    // Upload to storage
    try {
      const fileName = `study-materials/${Date.now()}-${file.name}`;
      setUploadProgress(50);
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(fileName, file, { contentType: "application/pdf" });

      if (uploadError) throw uploadError;

      setUploadProgress(80);
      const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
      const fileUrl = urlData.publicUrl;

      // Auto-fill fields locally
      updateLocal(id, "file_url", fileUrl);
      updateLocal(id, "file_size", fileSize);
      if (pageCount !== null) updateLocal(id, "pages", pageCount);

      // Also use title from filename if still default
      const currentItem = items.find(x => x.id === id);
      if (currentItem?.title === "New Material") {
        const cleanName = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
        updateLocal(id, "title", cleanName);
      }

      setUploadProgress(100);
      toast.success(`PDF uploaded — ${fileSize}, ${pageCount ?? "?"} pages`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setTimeout(() => {
        setUploadingId(null);
        setUploadProgress(0);
      }, 500);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Study Materials</h2>
        <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add</Button>
      </div>
      {items.map(item => (
        <div key={item.id} className="glass-card p-4 space-y-3">
          {/* PDF Upload with Drag & Drop */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
              dragOverId === item.id
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragOver={e => { e.preventDefault(); setDragOverId(item.id); }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={e => {
              e.preventDefault();
              setDragOverId(null);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFileUpload(item.id, file);
            }}
          >
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              ref={el => { fileInputRefs.current[item.id] = el; }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(item.id, file);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                disabled={uploadingId === item.id}
                onClick={() => fileInputRefs.current[item.id]?.click()}
              >
                {uploadingId === item.id ? (
                  <><Loader2 size={14} className="mr-1 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload size={14} className="mr-1" /> Upload PDF</>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">or drag & drop a PDF here</span>
            </div>
            {uploadingId === item.id && (
              <Progress value={uploadProgress} className="mt-2 h-2" />
            )}
          </div>

          {/* Fields */}
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={item.title} onChange={e => updateLocal(item.id, "title", e.target.value)} placeholder="Title" />
            <Input value={item.category} onChange={e => updateLocal(item.id, "category", e.target.value)} placeholder="Category" />
            <Input value={item.file_url || ""} onChange={e => updateLocal(item.id, "file_url", e.target.value)} placeholder="File URL (auto-filled on upload)" />
            <Input value={item.file_size || ""} onChange={e => updateLocal(item.id, "file_size", e.target.value)} placeholder="File Size (auto-detected)" />
            <Input type="number" value={item.pages || ""} onChange={e => updateLocal(item.id, "pages", e.target.value ? parseInt(e.target.value) : null)} placeholder="Pages (auto-detected)" />
            <div className="flex gap-2 items-end">
              <Button size="sm" onClick={() => update(item.id, { title: item.title, category: item.category, file_url: item.file_url, file_size: item.file_size, pages: item.pages })}><Save size={14} className="mr-1" /> Save</Button>
              <Button size="sm" variant="destructive" onClick={() => remove(item.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStudyMaterials;
