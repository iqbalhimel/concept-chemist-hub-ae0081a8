import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type SiteSettings = Record<string, Record<string, string>>;

let cachedSettings: SiteSettings | null = null;
let fetchPromise: Promise<SiteSettings> | null = null;

const fetchAllSettings = (): Promise<SiteSettings> => {
  if (cachedSettings) return Promise.resolve(cachedSettings);
  if (fetchPromise) return fetchPromise;

  fetchPromise = supabase
    .from("site_settings")
    .select("key, value")
    .then(({ data }) => {
      const mapped: SiteSettings = {};
      data?.forEach((row) => {
        mapped[row.key] = row.value as Record<string, string>;
      });
      cachedSettings = mapped;
      return mapped;
    });

  return fetchPromise;
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(cachedSettings || {});
  const [loaded, setLoaded] = useState(!!cachedSettings);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setLoaded(true);
      return;
    }
    fetchAllSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const get = (section: string, field: string, fallback = "") =>
    settings[section]?.[field] || fallback;

  return { settings, loaded, get };
};
