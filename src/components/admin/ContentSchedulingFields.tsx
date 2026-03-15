import { CalendarClock, X } from "lucide-react";
import { Input } from "@/components/ui/input";

/**
 * Shared scheduling inputs for admin edit forms.
 * Renders publish_at and expire_at datetime-local fields.
 */

interface ContentSchedulingFieldsProps {
  publishAt: string | null;
  expireAt: string | null;
  onPublishAtChange: (value: string | null) => void;
  onExpireAtChange: (value: string | null) => void;
  /** Label for publish field */
  publishLabel?: string;
  /** Label for expire field */
  expireLabel?: string;
}

const toLocalDatetime = (iso: string | null): string => {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  } catch {
    return "";
  }
};

export const getContentStatus = (
  opts: {
    isPublished?: boolean;
    isActive?: boolean;
    publishAt?: string | null;
    expireAt?: string | null;
    scheduledAt?: string | null;
  }
): "published" | "scheduled" | "expired" | "draft" => {
  const now = new Date();
  const expireAt = opts.expireAt ? new Date(opts.expireAt) : null;
  const publishAt = opts.publishAt ? new Date(opts.publishAt) : opts.scheduledAt ? new Date(opts.scheduledAt) : null;

  // Check expired first
  if (expireAt && expireAt < now) return "expired";

  // Check scheduled (publish_at in future)
  if (publishAt && publishAt > now) return "scheduled";

  // Check published/active
  if (opts.isPublished !== undefined) {
    return opts.isPublished ? "published" : "draft";
  }
  if (opts.isActive !== undefined) {
    return opts.isActive ? "published" : "draft";
  }

  return "draft";
};

export const ContentStatusBadge = ({ status }: { status: ReturnType<typeof getContentStatus> }) => {
  const styles: Record<string, string> = {
    published: "bg-green-500/15 text-green-600",
    scheduled: "bg-blue-500/15 text-blue-600",
    expired: "bg-orange-500/15 text-orange-600",
    draft: "bg-muted text-muted-foreground",
  };
  const labels: Record<string, string> = {
    published: "Published",
    scheduled: "Scheduled",
    expired: "Expired",
    draft: "Draft",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const ContentSchedulingFields = ({
  publishAt,
  expireAt,
  onPublishAtChange,
  onExpireAtChange,
  publishLabel = "Publish at",
  expireLabel = "Expire at",
}: ContentSchedulingFieldsProps) => {
  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <CalendarClock size={14} />
        <span>Content Scheduling</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{publishLabel}</label>
          <div className="flex items-center gap-1">
            <Input
              type="datetime-local"
              className="h-8 text-xs flex-1"
              value={toLocalDatetime(publishAt)}
              onChange={e => {
                const val = e.target.value;
                onPublishAtChange(val ? new Date(val).toISOString() : null);
              }}
            />
            {publishAt && (
              <button
                onClick={() => onPublishAtChange(null)}
                className="text-muted-foreground hover:text-destructive p-1"
                title="Clear"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {publishAt && new Date(publishAt) > new Date() && (
            <p className="text-[11px] text-blue-600 mt-1">
              Will become visible {new Date(publishAt).toLocaleString()}
            </p>
          )}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{expireLabel}</label>
          <div className="flex items-center gap-1">
            <Input
              type="datetime-local"
              className="h-8 text-xs flex-1"
              value={toLocalDatetime(expireAt)}
              onChange={e => {
                const val = e.target.value;
                onExpireAtChange(val ? new Date(val).toISOString() : null);
              }}
            />
            {expireAt && (
              <button
                onClick={() => onExpireAtChange(null)}
                className="text-muted-foreground hover:text-destructive p-1"
                title="Clear"
              >
                <X size={12} />
              </button>
            )}
          </div>
          {expireAt && new Date(expireAt) < new Date() && (
            <p className="text-[11px] text-orange-600 mt-1">
              Expired {new Date(expireAt).toLocaleString()}
            </p>
          )}
          {expireAt && new Date(expireAt) > new Date() && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Will expire {new Date(expireAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentSchedulingFields;
