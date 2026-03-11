import { useState, useEffect } from "react";
import { getTimeOfDay, type TimeOfDay } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/contexts/AuthContext";

const timeEmoji: Record<TimeOfDay, string> = { morning: "🌅", noon: "☀️", evening: "🌇", night: "🌙" };

const AtmosphereDebugBadge = () => {
  const { get, loaded } = useSiteSettings();
  const { isAdmin } = useAuth();
  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("lovable");

  const [time, setTime] = useState<TimeOfDay>(getTimeOfDay());

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeOfDay()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!isAdmin && !isPreview) return null;
  if (!loaded) return null;

  const enabled = get("atmosphere", "enabled", "true") !== "false";
  const timeOverride = get("atmosphere", "time_override", "");

  const validTimes = ["morning", "noon", "evening", "night"];
  const activeTime: TimeOfDay = validTimes.includes(timeOverride) ? (timeOverride as TimeOfDay) : time;

  return (
    <div
      className="fixed bottom-20 right-4 z-[10] rounded-lg border border-border bg-card/80 backdrop-blur-md px-3 py-2 shadow-lg text-xs leading-relaxed pointer-events-none"
      style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.15)" }}
    >
      <div className="font-medium text-foreground">
        {timeEmoji[activeTime]} <span className="capitalize">{activeTime}</span>
      </div>
      <div className={`font-medium ${enabled ? "text-primary" : "text-destructive"}`}>
        Atmosphere {enabled ? "Active" : "OFF"}
      </div>
    </div>
  );
};

export default AtmosphereDebugBadge;
