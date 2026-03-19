import { useState, memo } from "react";
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

  const inner = link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">
      {text}
    </a>
  ) : (
    <span>{text}</span>
  );

  return (
    <div className="relative z-[100] w-full h-9 flex items-center overflow-hidden pointer-events-none">
      <div className="announcement-slide whitespace-nowrap text-sm font-medium text-primary tracking-wide pointer-events-auto">
        <span className="inline-block px-[50vw]">{inner}</span>
        <span className="inline-block px-[50vw]" aria-hidden="true">{inner}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-foreground/50 hover:text-foreground/80 transition-colors pointer-events-auto"
        aria-label="Dismiss announcement"
      >
        <X size={12} />
      </button>
    </div>
  );
};

export default memo(AnnouncementBar);
