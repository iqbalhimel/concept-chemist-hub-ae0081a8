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

  // Repeat text enough times for seamless loop
  const repeated = `${text}  ·  `.repeat(6);

  const tickerContent = link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">
      {repeated}
    </a>
  ) : (
    <span>{repeated}</span>
  );

  return (
    <div className="relative z-[100] w-full bg-background/[0.08] backdrop-blur-md border-b border-border/30 shadow-[0_1px_8px_hsl(var(--primary)/0.1)]">
      <div className="overflow-hidden py-2 min-h-[36px] flex items-center pr-10">
        <div className="announcement-ticker whitespace-nowrap text-sm font-medium text-foreground/90 drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]">
          {tickerContent}
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-background/20 hover:bg-background/40 text-foreground/70 hover:text-foreground transition-colors"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
