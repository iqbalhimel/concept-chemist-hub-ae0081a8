import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Copy, FileText, Tag, Folder, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { UsageRef } from "@/hooks/useMediaUsage";

interface MediaItem {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
  folder: string;
  tags: string[];
}

interface Props {
  item: MediaItem;
  folders: string[];
  usageRefs: UsageRef[];
  onClose: () => void;
  onUpdateFolder: (id: string, folder: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const MediaDetailsPanel = ({ item, folders, usageRefs, onClose, onUpdateFolder, onAddTag, onRemoveTag }: Props) => {
  const [newTag, setNewTag] = useState("");
  const isImage = item.file_type.startsWith("image/");

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!tag) return;
    if (item.tags.includes(tag)) {
      toast.error("Tag already exists");
      return;
    }
    onAddTag(item.id, tag);
    setNewTag("");
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(item.file_url);
    toast.success("URL copied");
  };

  return (
    <div className="border border-border rounded-lg bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground truncate flex-1">Media Details</h3>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>

      {/* Preview */}
      <div className="rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
        {isImage ? (
          <img src={item.file_url} alt={item.name} className="w-full h-full object-contain" />
        ) : (
          <FileText className="text-muted-foreground" size={48} />
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Name</span>
          <span className="text-foreground font-medium truncate ml-2 max-w-[60%] text-right">{item.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Size</span>
          <span className="text-foreground">{formatSize(item.file_size)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type</span>
          <span className="text-foreground">{item.file_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Uploaded</span>
          <span className="text-foreground">
            {new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={copyUrl}>
            <Copy size={12} className="mr-1" /> Copy URL
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
            <a href={item.file_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={12} />
            </a>
          </Button>
        </div>
      </div>

      {/* Folder */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Folder size={12} /> Folder
        </label>
        <Select value={item.folder} onValueChange={v => onUpdateFolder(item.id, v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {folders.map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
          <Tag size={12} /> Tags
        </label>
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                {tag}
                <button onClick={() => onRemoveTag(item.id, tag)} className="hover:text-destructive">
                  <X size={10} />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-1">
          <Input
            className="h-7 text-xs flex-1"
            placeholder="Add tag..."
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddTag()}
          />
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={handleAddTag} disabled={!newTag.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* Usage */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Used in ({usageRefs.length})
        </label>
        {usageRefs.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">Not used anywhere</p>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {usageRefs.map((ref, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-primary font-medium shrink-0">{ref.source}</span>
                <span className="text-muted-foreground truncate">— {ref.title}</span>
              </div>
            ))}
          </div>
        )}
        {usageRefs.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-amber-500">
            <AlertTriangle size={10} />
            <span>Deleting this file may break content</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaDetailsPanel;
