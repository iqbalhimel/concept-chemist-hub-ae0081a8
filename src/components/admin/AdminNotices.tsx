import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical, Pin } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Tables } from "@/integrations/supabase/types";

type Notice = Tables<"notices">;

const SortableNoticeCard = ({
  notice,
  onUpdateLocal,
  onSave,
  onDelete,
  onTogglePin,
}: {
  notice: Notice;
  onUpdateLocal: (id: string, updates: Record<string, any>) => void;
  onSave: (n: Notice) => void;
  onDelete: (id: string) => void;
  onTogglePin: (n: Notice) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: notice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const n = notice as any;
  const isExpired = n.expires_at && new Date(n.expires_at) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-4 space-y-2 ${n.is_pinned ? "ring-2 ring-primary/50" : ""} ${isExpired ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical size={18} />
        </button>
        <Input
          value={notice.title}
          onChange={(e) => onUpdateLocal(notice.id, { title: e.target.value })}
          placeholder="Title"
          className="flex-1"
        />
        <Button
          size="icon"
          variant={n.is_pinned ? "default" : "outline"}
          className="shrink-0 h-8 w-8"
          onClick={() => onTogglePin(notice)}
          title={n.is_pinned ? "Unpin" : "Pin to top"}
        >
          <Pin size={14} className={n.is_pinned ? "fill-current" : ""} />
        </Button>
      </div>
      <Textarea
        value={notice.description || ""}
        onChange={(e) =>
          onUpdateLocal(notice.id, { description: e.target.value })
        }
        placeholder="Description"
      />
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-xs text-muted-foreground">
          Date
          <Input
            type="date"
            value={notice.date}
            onChange={(e) => onUpdateLocal(notice.id, { date: e.target.value })}
            className="w-auto mt-1"
          />
        </label>
        <label className="text-xs text-muted-foreground">
          Expires
          <Input
            type="date"
            value={n.expires_at || ""}
            onChange={(e) =>
              onUpdateLocal(notice.id, {
                expires_at: e.target.value || null,
              })
            }
            className="w-auto mt-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground pt-4">
          <Switch
            checked={notice.is_active}
            onCheckedChange={(v) => onUpdateLocal(notice.id, { is_active: v })}
          />
          Active
        </label>
        {isExpired && (
          <span className="text-xs font-semibold text-destructive pt-4">Expired</span>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave(notice)}>
          <Save size={14} className="mr-1" /> Save
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(notice.id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
};

const AdminNotices = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("sort_order", { ascending: true });
    setNotices(data || []);
    setLoading(false);
  };

  const addNotice = async () => {
    const maxOrder =
      notices.length > 0
        ? Math.max(...notices.map((n) => n.sort_order)) + 1
        : 0;
    const { error } = await supabase.from("notices").insert({
      title: "New Notice",
      description: "",
      date: new Date().toISOString().split("T")[0],
      sort_order: maxOrder,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notice added");
    fetchNotices();
  };

  const updateNotice = async (n: Notice) => {
    const a = n as any;
    const { error } = await supabase
      .from("notices")
      .update({
        title: n.title,
        description: n.description,
        date: n.date,
        is_active: n.is_active,
        is_pinned: a.is_pinned,
        expires_at: a.expires_at || null,
      } as any)
      .eq("id", n.id);
    if (error) toast.error(error.message);
    else toast.success("Updated");
  };

  const togglePin = async (n: Notice) => {
    const newVal = !(n as any).is_pinned;
    const { error } = await supabase
      .from("notices")
      .update({ is_pinned: newVal } as any)
      .eq("id", n.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNotices((prev) =>
      prev.map((x) =>
        x.id === n.id ? ({ ...x, is_pinned: newVal } as any) : x
      )
    );
    toast.success(newVal ? "Pinned" : "Unpinned");
  };

  const deleteNotice = async (id: string) => {
    await supabase.from("notices").delete().eq("id", id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
    toast.success("Deleted");
  };

  const updateLocal = (id: string, updates: Record<string, any>) => {
    setNotices((prev) =>
      prev.map((x) => (x.id === id ? ({ ...x, ...updates } as any) : x))
    );
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = notices.findIndex((n) => n.id === active.id);
    const newIndex = notices.findIndex((n) => n.id === over.id);
    const reordered = arrayMove(notices, oldIndex, newIndex);
    setNotices(reordered);

    const updates = reordered.map((n, i) => ({ id: n.id, sort_order: i }));
    for (const u of updates) {
      await supabase
        .from("notices")
        .update({ sort_order: u.sort_order })
        .eq("id", u.id);
    }
    toast.success("Order updated");
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Notices
        </h2>
        <Button onClick={addNotice} size="sm">
          <Plus size={14} className="mr-1" /> Add Notice
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={notices.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          {notices.map((n) => (
            <SortableNoticeCard
              key={n.id}
              notice={n}
              onUpdateLocal={updateLocal}
              onSave={updateNotice}
              onDelete={deleteNotice}
              onTogglePin={togglePin}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default AdminNotices;
