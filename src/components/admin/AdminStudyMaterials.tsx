import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload, Loader2, FileUp } from "lucide-react";
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
  const fileName = `study-materials/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, file, { contentType: "application/pdf" });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from("media").getPublicUrl(fileName);
  return urlData.publicUrl;
};

const AdminStudyMaterials = () => {
  const [items, setItems] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [bulkDragOver, setBulkDragOver] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const bulkInputRef = useRef<HTMLInputElement | null>(null);

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
        const cleanName = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
        updateLocal(id, "title", cleanName);
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
    if (pdfFiles.length === 0) {
      toast.error("No PDF files found");
      return;
    }

    setBulkUploading(true);
    setBulkProgress({ current: 0, total: pdfFiles.length });
    let successCount = 0;

    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];
      setBulkProgress({ current: i + 1, total: pdfFiles.length });

      try {
        const [{ pageCount, fileSize }, fileUrl] = await Promise.all([
          extractPdfMeta(file),
          uploadToStorage(file),
        ]);

        const cleanName = file.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

        const { error } = await supabase.from("study_materials").insert({
          title: cleanName,
          category: "Uncategorized",
          file_url: fileUrl,
          file_size: fileSize,
          pages: pageCount,
        });

        if (error) throw error;
        successCount++;
      } catch (err: any) {
        console.error(`Failed to upload ${file.name}:`, err);
        toast.error(`Failed: ${file.name}`);
      }
    }

    setBulkUploading(false);
    setBulkProgress({ current: 0, total: 0 });

    if (successCount > 0) {
      toast.success(`${successCount} PDF${successCount > 1 ? "s" : ""} uploaded successfully`);
      fetchItems();
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Study Materials</h2>
        <div className="flex gap-2">
          <Button onClick={() => bulkInputRef.current?.click()} size="sm" variant="outline" disabled={bulkUploading}>
            <FileUp size={14} className="mr-1" /> Bulk Upload
          </Button>
          <Button onClick={add} size="sm"><Plus size={14} className="mr-1" /> Add</Button>
        </div>
      </div>

      {/* Bulk drop zone */}
      <input
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        ref={bulkInputRef}
        onChange={e => {
          if (e.target.files?.length) handleBulkUpload(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          bulkDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40"
        }`}
        onDragOver={e => { e.preventDefault(); setBulkDragOver(true); }}
        onDragLeave={() => setBulkDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setBulkDragOver(false);
          if (e.dataTransfer.files?.length) handleBulkUpload(e.dataTransfer.files);
        }}
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
          <div className="space-y-1">
            <FileUp size={24} className="mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Drag & drop multiple PDFs here to bulk create study materials
            </p>
            <p className="text-xs text-muted-foreground/60">
              Each PDF becomes a new entry with auto-detected title, size & pages
            </p>
          </div>
        )}
      </div>

      {/* Individual items */}
      {items.map(item => (
        <div key={item.id} className="glass-card p-4 space-y-3">
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
