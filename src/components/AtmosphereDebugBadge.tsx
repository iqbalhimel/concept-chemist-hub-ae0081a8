import { useState, useEffect, useMemo } from "react";
import { getTimeOfDay, getSeason, timeGradients, type TimeOfDay, type Season } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/contexts/AuthContext";

const timeEmoji: Record<TimeOfDay, string> = { morning: "🌅", noon: "☀️", evening: "🌇", night: "🌙" };
const seasonEmoji: Record<Season, string> = { spring: "🌸", summer: "🔆", autumn: "🍂", winter: "❄️" };

const AtmosphereDebugBadge = () => {
  const { get, loaded } = useSiteSettings();
  const { isAdmin } = useAuth();
  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("lovable");

  const [time, setTime] = useState<TimeOfDay>(getTimeOfDay());
  const [season, setSeason] = useState<Season>(getSeason());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeOfDay());
      setSeason(getSeason());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!isAdmin && !isPreview) return null;
  if (!loaded) return null;

  const enabled = get("atmosphere", "enabled", "true") !== "false";
  const timeOverride = get("atmosphere", "time_override", "");
  const seasonOverride = get("atmosphere", "season_override", "");

  const validTimes = ["morning", "noon", "evening", "night"];
  const validSeasons = ["spring", "summer", "autumn", "winter"];
  const activeTime: TimeOfDay = validTimes.includes(timeOverride) ? (timeOverride as TimeOfDay) : time;
  const activeSeason: Season = validSeasons.includes(seasonOverride) ? (seasonOverride as Season) : season;

  return (
    <div
      className="fixed bottom-20 right-4 z-[9999] rounded-lg border border-border bg-card/80 backdrop-blur-md px-3 py-2 shadow-lg text-xs leading-relaxed pointer-events-none"
      style={{ boxShadow: "0 0 12px hsl(var(--primary) / 0.15)" }}
    >
      <div className="font-medium text-foreground">
        {timeEmoji[activeTime]} <span className="capitalize">{activeTime}</span>
        {" • "}
        {seasonEmoji[activeSeason]} <span className="capitalize">{activeSeason}</span>
      </div>
      <div className={`font-medium ${enabled ? "text-primary" : "text-destructive"}`}>
        Atmosphere {enabled ? "Active" : "OFF"}
      </div>
    </div>
  );
};

export default AtmosphereDebugBadge;
