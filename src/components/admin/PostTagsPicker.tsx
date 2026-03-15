import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Loader2 } from "lucide-react";
import { slugify } from "@/lib/slugify";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface PostTagsPickerProps {
  postId: string;
}

const PostTagsPicker = ({ postId }: PostTagsPickerProps) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, [postId]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: tags }, { data: postTags }] = await Promise.all([
      supabase.from("tags").select("id, name, slug").order("name"),
      supabase.from("post_tags").select("tag_id").eq("post_id", postId),
    ]);
    setAllTags(tags || []);
    setSelectedTagIds(new Set((postTags || []).map((pt: any) => pt.tag_id)));
    setLoading(false);
  };

  const toggleTag = async (tagId: string) => {
    setSaving(true);
    const isSelected = selectedTagIds.has(tagId);
    if (isSelected) {
      await supabase.from("post_tags").delete().eq("post_id", postId).eq("tag_id", tagId);
      setSelectedTagIds(prev => { const n = new Set(prev); n.delete(tagId); return n; });
    } else {
      const { error } = await supabase.from("post_tags").insert({ post_id: postId, tag_id: tagId });
      if (error && !error.message.includes("duplicate")) {
        toast.error(error.message);
      } else {
        setSelectedTagIds(prev => new Set(prev).add(tagId));
      }
    }
    setSaving(false);
  };

  const createAndAssign = async () => {
    const name = newTagName.trim();
    if (!name) return;
    setSaving(true);
    const slug = slugify(name);
    const { data: existing } = await supabase.from("tags").select("id").eq("slug", slug).maybeSingle();
    let tagId: string;
    if (existing) {
      tagId = existing.id;
    } else {
      const { data, error } = await supabase.from("tags").insert({ name, slug }).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      tagId = data.id;
      setAllTags(prev => [...prev, { id: tagId, name, slug }].sort((a, b) => a.name.localeCompare(b.name)));
    }
    if (!selectedTagIds.has(tagId)) {
      await supabase.from("post_tags").insert({ post_id: postId, tag_id: tagId });
      setSelectedTagIds(prev => new Set(prev).add(tagId));
    }
    setNewTagName("");
    setSaving(false);
    toast.success(`Tag "${name}" added`);
  };

  const filteredTags = search.trim()
    ? allTags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : allTags;

  if (loading) return <div className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Loading tags…</div>;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">Tags</label>

      {/* Selected tags */}
      {selectedTagIds.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {allTags.filter(t => selectedTagIds.has(t.id)).map(tag => (
            <Badge key={tag.id} variant="secondary" className="gap-1 text-xs cursor-pointer hover:bg-destructive/20" onClick={() => toggleTag(tag.id)}>
              {tag.name}
              <X size={10} />
            </Badge>
          ))}
        </div>
      )}

      {/* Search existing */}
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search tags…"
        className="h-8 text-xs"
      />

      {/* Available tags */}
      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
        {filteredTags.filter(t => !selectedTagIds.has(t.id)).map(tag => (
          <Badge
            key={tag.id}
            variant="outline"
            className="text-xs cursor-pointer hover:bg-accent transition-colors"
            onClick={() => toggleTag(tag.id)}
          >
            <Plus size={10} className="mr-0.5" /> {tag.name}
          </Badge>
        ))}
        {filteredTags.filter(t => !selectedTagIds.has(t.id)).length === 0 && (
          <span className="text-xs text-muted-foreground">No tags available</span>
        )}
      </div>

      {/* Create new */}
      <div className="flex gap-1.5">
        <Input
          value={newTagName}
          onChange={e => setNewTagName(e.target.value)}
          placeholder="New tag name…"
          className="h-8 text-xs flex-1"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); createAndAssign(); } }}
        />
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={createAndAssign} disabled={saving || !newTagName.trim()}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        </Button>
      </div>
    </div>
  );
};

export default PostTagsPicker;
