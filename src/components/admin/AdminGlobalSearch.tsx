import { useRef, useState, useEffect } from "react";
import { Search, X, Loader2, FileText, Bell, Download, Video, Image, MessageSquareQuote, HelpCircle } from "lucide-react";
import { useAdminSearch, type SearchResultModule } from "@/hooks/useAdminSearch";
import { cn } from "@/lib/utils";

const MODULE_ICONS: Record<SearchResultModule, React.ElementType> = {
  blog: FileText,
  notices: Bell,
  "study-materials": Download,
  videos: Video,
  gallery: Image,
  testimonials: MessageSquareQuote,
  faq: HelpCircle,
};

interface AdminGlobalSearchProps {
  onNavigate: (tab: string) => void;
}

export default function AdminGlobalSearch({ onNavigate }: AdminGlobalSearchProps) {
  const { query, setQuery, results, loading } = useAdminSearch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl/Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleSelect = (tab: string) => {
    onNavigate(tab);
    setOpen(false);
    setQuery("");
  };

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search content… (⌘K)"
          className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); }}
            className="absolute right-2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border border-border bg-popover shadow-lg max-h-80 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Searching…
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No results found
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="py-1">
              {results.map((r) => {
                const Icon = MODULE_ICONS[r.module];
                return (
                  <li key={`${r.module}-${r.id}`}>
                    <button
                      onClick={() => handleSelect(r.module)}
                      className="w-full flex items-start gap-3 px-3 py-2 text-left text-sm hover:bg-accent transition-colors"
                    >
                      <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{r.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span>{r.moduleLabel}</span>
                          {r.meta && (
                            <>
                              <span className="opacity-40">·</span>
                              <span className="truncate">{r.meta}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
