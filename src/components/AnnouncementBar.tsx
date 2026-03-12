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

  const inner = link ? (
    <a href={link} target="_blank" rel="noopener noreferrer" className="hover:underline underline-offset-2">
      {text}
    </a>
  ) : (
    <span>{text}</span>
  );

  return (
    <div className="relative z-[100] w-full h-7 flex items-center overflow-hidden pointer-events-none hero-gradient">
      <div className="announcement-slide whitespace-nowrap text-sm font-medium text-[#9fdcff] tracking-wide drop-shadow-[0_0_4px_rgba(159,220,255,0.5)] pointer-events-auto">
        {inner}
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

export default AnnouncementBar;
