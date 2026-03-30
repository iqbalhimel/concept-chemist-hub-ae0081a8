import { useState, useEffect, useMemo, forwardRef } from "react";
import { getTimeOfDay, timeGradients, type TimeOfDay } from "@/lib/atmosphere";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const AtmosphereLayer = forwardRef<HTMLDivElement>(function AtmosphereLayer(_props, ref) {
  const { get } = useSiteSettings();

  const enabled = get("atmosphere", "enabled", "true") !== "false";
  const timeOverride = get("atmosphere", "time_override", "");

  const [time, setTime] = useState<TimeOfDay>(getTimeOfDay());

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      setTime(getTimeOfDay());
    }, 60_000);
    return () => clearInterval(interval);
  }, [enabled]);

  const validTimes: string[] = ["morning", "noon", "evening", "night"];
  const activeTime: TimeOfDay = validTimes.includes(timeOverride) ? (timeOverride as TimeOfDay) : time;

  const gradient = useMemo(() => timeGradients[activeTime], [activeTime]);

  if (!enabled) return null;

  return (
    <div ref={ref} className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0, transform: "translateZ(0)" }} aria-hidden="true">
      <div className="absolute inset-0" style={{ backgroundImage: gradient }} />
    </div>
  );
});

export default AtmosphereLayer;
