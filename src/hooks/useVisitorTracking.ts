import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

function generateSessionId(): string {
  return `vs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "Mobile";
  if (w < 1024) return "Tablet";
  return "Desktop";
}

function getOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return "Unknown";
}

function getBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return "Unknown";
}

function getReferrerSource(): string {
  const ref = document.referrer;
  if (!ref) return "Direct";
  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();
    if (host.includes("google")) return "Google";
    if (host.includes("facebook") || host.includes("fb.")) return "Facebook";
    if (host.includes("twitter") || host.includes("t.co")) return "Twitter";
    if (host.includes("youtube")) return "YouTube";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("instagram")) return "Instagram";
    if (host === window.location.hostname) return "Internal";
    return host;
  } catch {
    return "Unknown";
  }
}

const TRACK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-visit`;

async function sendTrack(payload: Record<string, unknown>) {
  try {
    await fetch(TRACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent fail - don't impact UX
  }
}

function sendBeaconTrack(payload: Record<string, unknown>) {
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon(TRACK_URL, blob);
  } catch {
    // Silent fail
  }
}

export function useVisitorTracking() {
  const location = useLocation();
  const sessionIdRef = useRef<string>("");
  const startTimeRef = useRef<number>(Date.now());
  const pagesViewedRef = useRef<number>(0);
  const initializedRef = useRef(false);

  // Initialize session
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let sid = sessionStorage.getItem("visitor_session_id");
    if (!sid) {
      sid = generateSessionId();
      sessionStorage.setItem("visitor_session_id", sid);
    }
    sessionIdRef.current = sid;
    startTimeRef.current = Date.now();
    pagesViewedRef.current = 1;

    sendTrack({
      action: "start",
      session_id: sid,
      page_path: window.location.pathname,
      device_type: getDeviceType(),
      os: getOS(),
      browser: getBrowser(),
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
      referrer: getReferrerSource(),
    });

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      sendTrack({
        action: "heartbeat",
        session_id: sessionIdRef.current,
        page_path: window.location.pathname,
        time_spent_seconds: elapsed,
      });
    }, 30000);

    // End session on unload
    const handleUnload = () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      sendBeaconTrack({
        action: "end",
        session_id: sessionIdRef.current,
        page_path: window.location.pathname,
        time_spent_seconds: elapsed,
        pages_viewed: pagesViewedRef.current,
      });
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!sessionIdRef.current || !initializedRef.current) return;
    // Skip the initial page (already tracked in start)
    if (pagesViewedRef.current === 0) return;

    pagesViewedRef.current += 1;
    sendTrack({
      action: "pageview",
      session_id: sessionIdRef.current,
      page_path: location.pathname,
      pages_viewed: pagesViewedRef.current,
    });
  }, [location.pathname]);
}
