import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FolderPlus, Pencil, Trash2, X, Check, ImageIcon } from "lucide-react";

interface Props {
  folders: string[];
  activeFolder: string | null; // null = "All Media"
  folderCounts: Record<string, number>;
  totalCount: number;
  onSelect: (folder: string | null) => void;
  onAddFolder: (name: string) => void;
  onRenameFolder: (oldName: string, newName: string) => void;
  onDeleteFolder: (name: string) => void;
}

const MediaFolderSidebar = ({
  folders, activeFolder, folderCounts, totalCount,
  onSelect, onAddFolder, onRenameFolder, onDeleteFolder,
}: Props) => {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAddFolder(trimmed);
    setNewName("");
    setAdding(false);
  };

  const handleRename = (oldName: string) => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingFolder(null);
      return;
    }
    onRenameFolder(oldName, trimmed);
    setEditingFolder(null);
  };

  const FolderItem = ({ name, count, isActive }: { name: string | null; count: number; isActive: boolean }) => (
    <button
      onClick={() => onSelect(name)}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      {name === null ? <ImageIcon size={14} /> : <Folder size={14} />}
      <span className="flex-1 text-left truncate">{name ?? "All Media"}</span>
      <span className="text-xs opacity-60">{count}</span>
    </button>
  );

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setAdding(!adding)}>
          {adding ? <X size={12} /> : <FolderPlus size={12} />}
        </Button>
      </div>

      {adding && (
        <div className="flex gap-1 px-1 mb-2">
          <Input
            className="h-7 text-xs"
            placeholder="Folder name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            autoFocus
          />
          <Button size="sm" variant="outline" className="h-7 px-2" onClick={handleAdd} disabled={!newName.trim()}>
            <Check size={12} />
          </Button>
        </div>
      )}

      <FolderItem name={null} count={totalCount} isActive={activeFolder === null} />

      {folders.map(folder => (
        <div key={folder} className="group relative">
          {editingFolder === folder ? (
            <div className="flex gap-1 px-1">
              <Input
                className="h-7 text-xs"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleRename(folder);
                  if (e.key === "Escape") setEditingFolder(null);
                }}
                autoFocus
              />
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleRename(folder)}>
                <Check size={12} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <FolderItem name={folder} count={folderCounts[folder] || 0} isActive={activeFolder === folder} />
              </div>
              <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
                <button
                  className="p-1 text-muted-foreground hover:text-foreground rounded"
                  onClick={e => { e.stopPropagation(); setEditingFolder(folder); setEditName(folder); }}
                >
                  <Pencil size={10} />
                </button>
                {(folderCounts[folder] || 0) === 0 && (
                  <button
                    className="p-1 text-muted-foreground hover:text-destructive rounded"
                    onClick={e => { e.stopPropagation(); onDeleteFolder(folder); }}
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MediaFolderSidebar;
