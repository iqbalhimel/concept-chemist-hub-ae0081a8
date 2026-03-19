import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type SiteSettings = Record<string, Record<string, string>>;

let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings> | null = null;
let listeners: Set<(s: SiteSettings) => void> = new Set();

const fetchAllSettings = (force = false): Promise<SiteSettings> => {
  if (!force && cachedSettings) return Promise.resolve(cachedSettings);
  if (!force && fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    const mapped: SiteSettings = {};
    data?.forEach((row) => {
      mapped[row.key] = row.value as Record<string, string>;
    });
    cachedSettings = mapped;
    fetchPromise = null;
    return mapped;
  })();

  return fetchPromise;
};

export const invalidateSiteSettings = () => {
  cachedSettings = null;
  fetchPromise = null;
  fetchAllSettings(true).then((s) => {
    listeners.forEach((fn) => fn(s));
  });
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings || {});
  const [loaded, setLoaded] = useState(!!cachedSettings);

  useEffect(() => {
    const listener = (s: SiteSettings) => {
      setSettings(s);
      setLoaded(true);
    };
    listeners.add(listener);

    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoaded(true);
    } else {
      fetchAllSettings().then(listener);
    }

    return () => { listeners.delete(listener); };
  }, []);

  const get = useCallback(
    (section: string, field: string, fallback = "") =>
      settings[section]?.[field] || fallback,
    [settings]
  );

  return { settings, loaded, get };
};
