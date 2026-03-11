import { useState, useEffect, useMemo, forwardRef } from "react";
import { getTimeOfDay, getSeason, timeGradients, seasonTints, type TimeOfDay, type Season } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useAuth } from "@/contexts/AuthContext";
import SeasonalParticles from "./SeasonalParticles";

const timeEmoji: Record<TimeOfDay, string> = { morning: "🌅", noon: "☀️", evening: "🌇", night: "🌙" };
const seasonEmoji: Record<Season, string> = { spring: "🌸", summer: "🔆", autumn: "🍂", winter: "❄️" };

const AtmosphereLayer = forwardRef<HTMLDivElement>(function AtmosphereLayer(_props, ref) {
  const { get } = useSiteSettings();
  const { isAdmin } = useAuth();
  const isPreview = typeof window !== "undefined" && window.location.hostname.includes("lovable");
  const showDebug = isAdmin || isPreview;
  const enabled = get("atmosphere", "enabled", "true") !== "false";
  const seasonEnabled = get("atmosphere", "seasonal_enabled", "true") !== "false";
  const timeOverride = get("atmosphere", "time_override", "");
  const seasonOverride = get("atmosphere", "season_override", "");

  const [time, setTime] = useState<TimeOfDay>(getTimeOfDay());
  const [season, setSeason] = useState<Season>(getSeason());

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setTime(getTimeOfDay());
      setSeason(getSeason());
    }, 60_000);
    return () => clearInterval(interval);
  }, [enabled]);

  const validTimes: string[] = ["morning", "noon", "evening", "night"];
  const validSeasons: string[] = ["spring", "summer", "autumn", "winter"];
  const activeTime: TimeOfDay = validTimes.includes(timeOverride) ? (timeOverride as TimeOfDay) : time;
  const activeSeason: Season = validSeasons.includes(seasonOverride) ? (seasonOverride as Season) : season;

  const gradient = useMemo(() => timeGradients[activeTime], [activeTime]);
  const tint = useMemo(() => (seasonEnabled ? seasonTints[activeSeason] : "transparent"), [seasonEnabled, activeSeason]);

  if (!enabled) {
    return showDebug ? (
      <div className="fixed bottom-20 right-4 z-50 pointer-events-auto rounded-lg border border-border bg-card/90 backdrop-blur-sm px-3 py-2 text-xs text-muted-foreground shadow-lg">
        Atmosphere <span className="text-destructive font-medium">OFF</span>
      </div>
    ) : null;
  }

  const debugBadge = showDebug ? (
    <div className="fixed bottom-20 right-4 z-[9999] pointer-events-auto rounded-lg border border-border bg-card/90 backdrop-blur-sm px-3 py-2 shadow-lg text-xs leading-relaxed">
      <div className="font-medium text-foreground">
        {timeEmoji[activeTime]} <span className="capitalize">{activeTime}</span>
        {" • "}
        {seasonEmoji[activeSeason]} <span className="capitalize">{activeSeason}</span>
      </div>
      <div className="text-primary font-medium">Atmosphere Active</div>
    </div>
  ) : null;

  return (
    <>
      <div ref={ref} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        <div className="absolute inset-0 transition-all duration-[3000ms] ease-in-out" style={{ backgroundImage: gradient }} />
        <div className="absolute inset-0 transition-all duration-[3000ms] ease-in-out" style={{ backgroundColor: tint }} />
        {seasonEnabled && <SeasonalParticles season={activeSeason} />}
      </div>
      {debugBadge}
    </>
  );
});

export default AtmosphereLayer;
