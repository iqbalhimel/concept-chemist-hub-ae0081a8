import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload, GripVertical } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type GalleryItem = Tables<"gallery">;

const SortableGalleryItem = ({
  item,
  onUpdateLocal,
  onSave,
  onRemove,
}: {
  item: GalleryItem;
  onUpdateLocal: (id: string, field: string, value: string) => void;
  onSave: (item: GalleryItem) => void;
  onRemove: (id: string, imageUrl: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="glass-card p-4 flex gap-4 items-start">
      <button {...attributes} {...listeners} className="mt-3 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none">
        <GripVertical size={20} />
      </button>
      {item.image_url && <img src={item.image_url} alt={item.alt || ""} className="w-20 h-20 rounded-lg object-cover bg-muted" />}
      <div className="flex-1 space-y-2">
        <Input value={item.image_url} onChange={e => onUpdateLocal(item.id, "image_url", e.target.value)} placeholder="Image URL" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={item.label || ""} onChange={e => onUpdateLocal(item.id, "label", e.target.value)} placeholder="Label" />
          <Input value={item.alt || ""} onChange={e => onUpdateLocal(item.id, "alt", e.target.value)} placeholder="Alt text" />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSave(item)}><Save size={14} className="mr-1" /> Save</Button>
          <Button size="sm" variant="destructive" onClick={() => onRemove(item.id, item.image_url)}><Trash2 size={14} className="mr-1" /> Delete</Button>
        </div>
      </div>
    </div>
  );
};

const AdminGallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("gallery").select("*").order("sort_order", { ascending: true });
    setItems(data || []);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : -1;

    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const ext = file.name.split(".").pop();
      const path = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
      if (uploadError) { toast.error("Upload failed: " + uploadError.message); continue; }

      const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);

      const { error } = await supabase.from("gallery").insert({
        image_url: urlData.publicUrl,
        label: file.name.replace(/\.[^.]+$/, ""),
        alt: file.name.replace(/\.[^.]+$/, ""),
        sort_order: maxOrder + 1 + idx,
      });
      if (error) toast.error(error.message);
    }

    toast.success("Images added to gallery");
    setUploading(false);
    fetchAll();
    if (fileRef.current) fileRef.current.value = "";
  };

  const add = async () => {
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : -1;
    const { error } = await supabase.from("gallery").insert({ image_url: "", label: "New Image", sort_order: maxOrder + 1 });
    if (error) { toast.error(error.message); return; }
    toast.success("Added");
    fetchAll();
  };

  const update = async (item: GalleryItem) => {
    const { error } = await supabase.from("gallery").update({ image_url: item.image_url, label: item.label, alt: item.alt }).eq("id", item.id);
    if (error) toast.error(error.message); else toast.success("Updated");
  };

  const remove = async (id: string, imageUrl: string) => {
    const urlParts = imageUrl.split("/media/");
    if (urlParts[1]) {
      await supabase.storage.from("media").remove([urlParts[1]]);
    }
    await supabase.from("gallery").delete().eq("id", id);
    setItems(prev => prev.filter(n => n.id !== id));
    toast.success("Deleted");
  };

  const updateLocal = (id: string, field: string, value: string) => {
    setItems(prev => prev.map(x => x.id === id ? { ...x, [field]: value } : x));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    setItems(reordered);

    // Persist new sort_order values
    const updates = reordered.map((item, idx) => 
      supabase.from("gallery").update({ sort_order: idx }).eq("id", item.id)
    );
    await Promise.all(updates);
    toast.success("Order updated");
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-2xl font-bold text-foreground">Gallery</h2>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} size="sm" disabled={uploading}>
            <Upload size={14} className="mr-1" /> {uploading ? "Uploading..." : "Upload Images"}
          </Button>
          <Button onClick={add} size="sm" variant="outline"><Plus size={14} className="mr-1" /> Add by URL</Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Drag the grip icon to reorder images.</p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <SortableGalleryItem
              key={item.id}
              item={item}
              onUpdateLocal={updateLocal}
              onSave={update}
              onRemove={remove}
            />
          ))}
        </SortableContext>
      </DndContext>

      {items.length === 0 && <p className="text-muted-foreground text-center py-8">No gallery images yet. Upload images or add by URL.</p>}
    </div>
  );
};

export default AdminGallery;
