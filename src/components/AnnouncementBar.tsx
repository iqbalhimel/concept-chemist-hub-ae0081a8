import { useState } from "react";
import { X } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const AnnouncementBar = () => {
  const { get, loaded } = useSiteSettings();
  const [dismissed, setDismissed] = useState(false);

  if (!loaded || dismissed) return null;

  const enabled = get("announcement", "enabled", "false");
  if (enabled !== "true") return null;

  const text = get("announcement", "text", "");
  const link = get("announcement", "link", "");

  if (!text) return null;

  const content = (
    <span className="text-sm font-medium truncate">{text}</span>
  );

  return (
    <div className="relative z-[100] w-full bg-primary/90 backdrop-blur-sm text-primary-foreground shadow-[0_2px_12px_hsl(var(--primary)/0.3)]">
      <div className="flex items-center justify-center gap-2 px-10 py-2.5 min-h-[40px]">
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline underline-offset-2 truncate"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-primary-foreground/20 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
