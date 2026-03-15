import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

interface MediaItem {
  id: string;
  name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  folder: string;
  tags: string[];
}

interface Props {
  items: MediaItem[];
  selectedIds: Set<string>;
  activeDetailId: string | null;
  onToggleSelect: (id: string) => void;
  onOpenDetails: (id: string) => void;
  usageCounts: Record<string, number>;
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const MediaGrid = ({ items, selectedIds, activeDetailId, onToggleSelect, onOpenDetails, usageCounts }: Props) => {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {items.map(item => {
        const isImage = item.file_type.startsWith("image/");
        const isSelected = selectedIds.has(item.id);
        const isActive = activeDetailId === item.id;
        const useCount = usageCounts[item.file_url] || 0;

        return (
          <div
            key={item.id}
            className={`group relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
              isActive
                ? "border-primary ring-2 ring-primary/20"
                : isSelected
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-muted-foreground/40"
            }`}
            onClick={() => onOpenDetails(item.id)}
          >
            {/* Checkbox */}
            <div
              className={`absolute top-1.5 left-1.5 z-10 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
              onClick={e => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(item.id)}
                className="bg-background/80 backdrop-blur-sm"
              />
            </div>

            {/* Usage indicator */}
            {useCount > 0 && (
              <div className="absolute top-1.5 right-1.5 z-10">
                <span className="text-[9px] bg-primary/90 text-primary-foreground px-1 py-0.5 rounded-sm font-medium">
                  {useCount} use{useCount > 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Thumbnail */}
            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
              {isImage ? (
                <img
                  src={item.file_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <FileText className="text-muted-foreground" size={32} />
              )}
            </div>

            {/* Info */}
            <div className="p-2 space-y-1">
              <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
              <p className="text-[10px] text-muted-foreground">{formatSize(item.file_size)}</p>
              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {item.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-[8px] px-1 py-0 h-3.5">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-[8px] text-muted-foreground">+{item.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MediaGrid;
