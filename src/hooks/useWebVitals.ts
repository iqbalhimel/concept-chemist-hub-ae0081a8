import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function getDeviceType() {
  const w = window.innerWidth;
  return w < 768 ? "Mobile" : w < 1024 ? "Tablet" : "Desktop";
}

function getSessionId() {
  let id = sessionStorage.getItem("cwv_session");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("cwv_session", id);
  }
  return id;
}

function getRating(name: string, value: number): string {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
    INP: [200, 500],
  };
  const t = thresholds[name];
  if (!t) return "unknown";
  return value <= t[0] ? "good" : value <= t[1] ? "needs-improvement" : "poor";
}

export function useWebVitals() {
  useEffect(() => {
    const reportMetric = async (name: string, value: number) => {
      try {
        await supabase.from("core_web_vitals").insert({
          session_id: getSessionId(),
          page_path: window.location.pathname,
          metric_name: name,
          metric_value: value,
          rating: getRating(name, value),
          device_type: getDeviceType(),
        });
      } catch (e) {
        // silently fail
      }
    };

    import("web-vitals").then(({ onLCP, onFID, onCLS, onFCP, onTTFB, onINP }) => {
      onLCP(({ value }) => reportMetric("LCP", value));
      onFID(({ value }) => reportMetric("FID", value));
      onCLS(({ value }) => reportMetric("CLS", value));
      onFCP(({ value }) => reportMetric("FCP", value));
      onTTFB(({ value }) => reportMetric("TTFB", value));
      onINP(({ value }) => reportMetric("INP", value));
    }).catch(() => {
      // web-vitals not available
    });
  }, []);
}
