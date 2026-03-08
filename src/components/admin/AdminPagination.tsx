import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZES = [10, 20, 50, 100] as const;

interface AdminPaginationProps {
  total: number;
  page: number;
  pageSize: number | "all";
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number | "all") => void;
}

const AdminPagination = ({ total, page, pageSize, onPageChange, onPageSizeChange }: AdminPaginationProps) => {
  const isAll = pageSize === "all";
  const totalPages = isAll ? 1 : Math.ceil(total / (pageSize as number));
  const from = isAll ? 1 : (page - 1) * (pageSize as number) + 1;
  const to = isAll ? total : Math.min(page * (pageSize as number), total);

  return (
    <div className="space-y-2">
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Show:</span>
        <Select
          value={String(pageSize)}
          onValueChange={v => onPageSizeChange(v === "all" ? "all" : Number(v))}
        >
          <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAGE_SIZES.map(s => (
              <SelectItem key={s} value={String(s)}>{s}</SelectItem>
            ))}
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pagination controls + info */}
      {!isAll && totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-8 px-2">
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button
                key={p}
                size="sm"
                variant={p === page ? "default" : "outline"}
                onClick={() => onPageChange(p)}
                className="h-8 w-8 p-0 text-xs"
              >
                {p}
              </Button>
            ))}
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="h-8 px-2">
              <ChevronRight size={14} />
            </Button>
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="h-8 text-xs">
              <ChevronLeft size={14} className="mr-1" /> Prev
            </Button>
            <span className="text-xs text-muted-foreground">Page {page}/{totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="h-8 text-xs">
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {from}–{to} of {total} items
          </p>
        </div>
      )}

      {/* Info when all or single page */}
      {(isAll || totalPages <= 1) && total > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {from}–{to} of {total} items
        </p>
      )}
    </div>
  );
};

/** Helper: paginate an array client-side */
export function paginateItems<T>(items: T[], page: number, pageSize: number | "all"): T[] {
  if (pageSize === "all") return items;
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export default AdminPagination;
