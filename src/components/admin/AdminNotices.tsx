import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Save, GripVertical, Pin, AlertTriangle, CheckSquare, Square } from "lucide-react";
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
  inputRef,
  selected,
  onToggleSelect,
}: {
  notice: Notice;
  onUpdateLocal: (id: string, updates: Record<string, any>) => void;
  onSave: (n: Notice) => void;
  onDelete: (id: string) => void;
  onTogglePin: (n: Notice) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  selected: boolean;
  onToggleSelect: (id: string) => void;
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
      className={`glass-card p-4 space-y-2 ${n.is_pinned ? "ring-2 ring-primary/50" : ""} ${isExpired ? "opacity-50" : ""} ${selected ? "ring-2 ring-primary/50" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button onClick={() => onToggleSelect(notice.id)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          {selected ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} />}
        </button>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        >
          <GripVertical size={18} />
        </button>
        <Input
          ref={inputRef}
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
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [newNoticeId, setNewNoticeId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const newTitleRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    fetchNotices();
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

  // Focus & scroll to new notice
  useEffect(() => {
    if (newNoticeId) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        newTitleRef.current?.focus();
        setNewNoticeId(null);
      }, 100);
    }
  }, [newNoticeId]);

  const fetchNotices = async () => {
    const { data } = await supabase
      .from("notices")
      .select("*")
      .order("sort_order", { ascending: true });
    setNotices(data || []);
    setLoading(false);
    setOrderDirty(false);
  };

  const addNotice = async () => {
    // Insert with sort_order 0, shift others up
    const { data, error } = await supabase
      .from("notices")
      .insert({
        title: "New Notice",
        description: "",
        date: new Date().toISOString().split("T")[0],
        sort_order: 0,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message || "Failed to add notice");
      return;
    }
    // Shift existing sort_orders
    const updated = notices.map((n, i) => ({ ...n, sort_order: i + 1 }));
    for (const u of updated) {
      await supabase.from("notices").update({ sort_order: u.sort_order }).eq("id", u.id);
    }
    setNotices([data, ...updated]);
    setNewNoticeId(data.id);
    toast.success("Notice added");
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
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    toast.success("Deleted");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allIds = notices.map((n) => n.id);
    const allSelected = allIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected notice(s)? This cannot be undone.`)) return;
    setBulkDeleting(true);
    for (const id of selectedIds) {
      await supabase.from("notices").delete().eq("id", id);
    }
    setNotices((prev) => prev.filter((n) => !selectedIds.has(n.id)));
    toast.success(`${selectedIds.size} notice(s) deleted`);
    setSelectedIds(new Set());
    setBulkDeleting(false);
  };

  const updateLocal = (id: string, updates: Record<string, any>) => {
    setNotices((prev) =>
      prev.map((x) => (x.id === id ? ({ ...x, ...updates } as any) : x))
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = notices.findIndex((n) => n.id === active.id);
    const newIndex = notices.findIndex((n) => n.id === over.id);
    setNotices(arrayMove(notices, oldIndex, newIndex));
    setOrderDirty(true);
  };

  const saveOrder = useCallback(async () => {
    setSavingOrder(true);
    for (let i = 0; i < notices.length; i++) {
      await supabase
        .from("notices")
        .update({ sort_order: i })
        .eq("id", notices[i].id);
    }
    setOrderDirty(false);
    setSavingOrder(false);
    toast.success("Order saved");
  }, [notices]);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4 relative">
      <div ref={topRef} className="flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-2 -mt-2">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Notices
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <Button size="sm" variant="destructive" onClick={bulkDelete} disabled={bulkDeleting} className="animate-in fade-in">
              <Trash2 size={14} className="mr-1" />
              {bulkDeleting ? "Deleting…" : `Delete (${selectedIds.size})`}
            </Button>
          )}
          {orderDirty && (
            <>
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle size={12} /> Order changed
              </span>
              <Button
                size="sm"
                onClick={saveOrder}
                disabled={savingOrder}
                className="animate-in fade-in"
              >
                <Save size={14} className="mr-1" />
                {savingOrder ? "Saving…" : "Save Order"}
              </Button>
            </>
          )}
          <Button onClick={addNotice} size="sm">
            <Plus size={14} className="mr-1" /> Add Notice
          </Button>
        </div>
      </div>
      {/* Select all toggle */}
      {notices.length > 0 && (
        <div className="flex items-center gap-2">
          <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground transition-colors">
            {notices.length > 0 && notices.every((n) => selectedIds.has(n.id)) ? <CheckSquare size={16} /> : <Square size={16} />}
          </button>
          <span className="text-xs text-muted-foreground">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
          </span>
        </div>
      )}
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
              inputRef={n.id === newNoticeId ? newTitleRef : undefined}
              selected={selectedIds.has(n.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default AdminNotices;
