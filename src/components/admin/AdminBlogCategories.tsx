import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2, Save, Pencil, X, Tag, AlertTriangle } from "lucide-react";
import { useCsrfGuard } from "@/hooks/useCsrfGuard";

interface ManagedCategory {
  name: string;
  sort_order: number;
}

const AdminBlogCategories = () => {
  const csrfGuard = useCsrfGuard();
  const [categories, setCategories] = useState<ManagedCategory[]>([]);
  const [postCounts, setPostCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // Load managed categories from site_settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "blog_categories")
      .maybeSingle();

    // Load all blog posts to count categories and discover unmanaged ones
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("category");

    const counts: Record<string, number> = {};
    (posts || []).forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    setPostCounts(counts);

    let managed: ManagedCategory[] = [];
    if (settingsData?.value && Array.isArray(settingsData.value)) {
      managed = (settingsData.value as any[]).map((c: any, i: number) => ({
        name: String(c.name || c),
        sort_order: c.sort_order ?? i,
      }));
    }

    // Merge in any categories from posts that aren't in the managed list
    const managedNames = new Set(managed.map(c => c.name));
    const usedCategories = Object.keys(counts).sort();
    usedCategories.forEach(cat => {
      if (!managedNames.has(cat)) {
        managed.push({ name: cat, sort_order: managed.length });
      }
    });

    managed.sort((a, b) => a.sort_order - b.sort_order);
    setCategories(managed);
    setLoading(false);
  };

  const persist = async (updated: ManagedCategory[]) => {
    const payload = updated.map((c, i) => ({ name: c.name, sort_order: i }));
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: "blog_categories", value: payload as any }, { onConflict: "key" });
    if (error) { toast.error("Failed to save categories"); return false; }
    return true;
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) { toast.error("Category name is required"); return; }
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Category already exists"); return;
    }
    await csrfGuard(async () => {
      const updated = [...categories, { name: trimmed, sort_order: categories.length }];
      if (await persist(updated)) {
        setCategories(updated);
        setNewName("");
        setAdding(false);
        toast.success("Category added");
      }
    });
  };

  const handleRename = async (idx: number) => {
    const trimmed = editValue.trim();
    if (!trimmed) { toast.error("Name cannot be empty"); return; }
    const oldName = categories[idx].name;
    if (oldName === trimmed) { setEditingIdx(null); return; }
    if (categories.some((c, i) => i !== idx && c.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Category already exists"); return;
    }
    await csrfGuard(async () => {
      const updated = categories.map((c, i) => i === idx ? { ...c, name: trimmed } : c);
      if (await persist(updated)) {
        // Also update all blog posts with the old category name
        const count = postCounts[oldName] || 0;
        if (count > 0) {
          const { error } = await supabase
            .from("blog_posts")
            .update({ category: trimmed } as any)
            .eq("category", oldName);
          if (error) toast.error("Failed to update posts");
        }
        setCategories(updated);
        setEditingIdx(null);
        toast.success("Category renamed");
        // Refresh counts
        loadData();
      }
    });
  };

  const handleDelete = async (idx: number) => {
    const cat = categories[idx];
    const count = postCounts[cat.name] || 0;
    if (count > 0) {
      if (!window.confirm(`"${cat.name}" is used by ${count} post(s). Posts will keep this category value but it will no longer appear in the managed list. Continue?`)) return;
    } else {
      if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    }
    await csrfGuard(async () => {
      const updated = categories.filter((_, i) => i !== idx).map((c, i) => ({ ...c, sort_order: i }));
      if (await persist(updated)) {
        setCategories(updated);
        toast.success("Category deleted");
      }
    });
  };

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="admin-section-header">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Blog Categories</h2>
          <p className="text-sm text-muted-foreground">{categories.length} categories</p>
        </div>
        <Button size="sm" onClick={() => { setAdding(true); setNewName(""); }}>
          <Plus size={14} className="mr-1" /> Add Category
        </Button>
      </div>

      {adding && (
        <div className="admin-card p-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground text-sm">New Category</h3>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Physics, Chemistry, Study Tips..."
              className="flex-1"
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <Button size="sm" onClick={handleAdd}><Save size={14} className="mr-1" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}><X size={14} /></Button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <Tag size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No categories yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {categories.map((cat, idx) => {
            const count = postCounts[cat.name] || 0;
            const isEditing = editingIdx === idx;

            return (
              <div key={`${cat.name}-${idx}`} className="admin-row px-4 py-3">
                <div className="flex items-center gap-3">
                  <Tag size={14} className="text-muted-foreground shrink-0" />
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Input
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        className="h-8 flex-1"
                        onKeyDown={e => { if (e.key === "Enter") handleRename(idx); if (e.key === "Escape") setEditingIdx(null); }}
                        autoFocus
                      />
                      <Button size="sm" className="h-8" onClick={() => handleRename(idx)}><Save size={12} /></Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingIdx(null)}><X size={12} /></Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-foreground text-sm flex-1 min-w-0 truncate">{cat.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {count} {count === 1 ? "post" : "posts"}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">In use</span>
                      )}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setEditingIdx(idx); setEditValue(cat.name); }}>
                          <Pencil size={13} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(idx)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminBlogCategories;
