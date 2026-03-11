import { useState, useEffect, useMemo, forwardRef } from "react";
import { getTimeOfDay, getSeason, timeGradients, seasonTints, type TimeOfDay, type Season } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import SeasonalParticles from "./SeasonalParticles";

const AtmosphereLayer = forwardRef<HTMLDivElement>(function AtmosphereLayer(_props, ref) {
  const { get } = useSiteSettings();

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

  if (!enabled) return null;

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
      {/* Time-based gradient */}
      <div
        className="absolute inset-0 transition-all duration-[3000ms] ease-in-out"
        style={{ backgroundImage: gradient }}
      />
      {/* Season tint overlay */}
      <div
        className="absolute inset-0 transition-all duration-[3000ms] ease-in-out"
        style={{ backgroundColor: tint }}
      />
      {/* Seasonal particles */}
      {seasonEnabled && <SeasonalParticles season={activeSeason} />}
    </div>
  );
});

AtmosphereLayer.displayName = "AtmosphereLayer";
export default AtmosphereLayer;
