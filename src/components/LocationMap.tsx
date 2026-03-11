import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useBrightness } from "@/contexts/BrightnessContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ExternalLink, MapPin } from "lucide-react";

const SCHOOL_LAT = 24.427541;
const SCHOOL_LNG = 90.780505;
const SCHOOL_NAME = "Zilla Smarani Girls' High School";
const SCHOOL_ADDRESS = "Kishoreganj, Bangladesh";

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

/* Glowing custom marker using SVG */
const createGlowIcon = (isDark: boolean) => {
  const primary = isDark ? "#818cf8" : "#7c3aed";
  const glow = isDark ? "rgba(129,140,248,0.45)" : "rgba(124,58,237,0.3)";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle cx="20" cy="20" r="18" fill="${glow}" opacity="0.5"/>
      <circle cx="20" cy="20" r="10" fill="${primary}" filter="url(#glow)"/>
      <circle cx="20" cy="20" r="5" fill="white" opacity="0.9"/>
      <path d="M20 30 L20 48" stroke="${primary}" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
      <circle cx="20" cy="48" r="2.5" fill="${primary}" opacity="0.5"/>
    </svg>`;
  return L.divIcon({
    html: `<div class="map-marker-glow">${svg}</div>`,
    className: "custom-glow-marker",
    iconSize: [40, 52],
    iconAnchor: [20, 52],
    popupAnchor: [0, -52],
  });
};

/* Swap tile layer when theme changes */
const ThemeWatcher = ({ isDark }: { isDark: boolean }) => {
  const map = useMap();
  const tileRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (tileRef.current) map.removeLayer(tileRef.current);
    const tiles = L.tileLayer(isDark ? DARK_TILES : LIGHT_TILES, { attribution: TILE_ATTR, maxZoom: 19 });
    tiles.addTo(map);
    tileRef.current = tiles;
  }, [isDark, map]);

  return null;
};

const LocationMap = () => {
  const { mode } = useBrightness();
  const { t } = useLanguage();
  const isDark = mode === "dark";
  const [icon, setIcon] = useState(() => createGlowIcon(isDark));

  useEffect(() => {
    setIcon(createGlowIcon(isDark));
  }, [isDark]);

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${SCHOOL_LAT},${SCHOOL_LNG}`;

  const circleOptions = {
    center: [SCHOOL_LAT, SCHOOL_LNG] as [number, number],
    radius: 250,
    pathOptions: {
      color: isDark ? "rgba(129,140,248,0.5)" : "rgba(124,58,237,0.4)",
      fillColor: isDark ? "rgba(129,140,248,0.08)" : "rgba(124,58,237,0.06)",
      fillOpacity: 1,
      weight: 1.5,
      dashArray: "6 4",
    },
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-lg">
      {/* Edge glow effect */}
      <div
        className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
        style={{
          boxShadow: isDark
            ? "inset 0 0 30px rgba(129,140,248,0.08), 0 0 40px rgba(129,140,248,0.06)"
            : "inset 0 0 20px rgba(124,58,237,0.04), 0 0 30px rgba(124,58,237,0.03)",
        }}
      />

      <MapContainer
        center={[SCHOOL_LAT, SCHOOL_LNG]}
        zoom={15}
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={true}
        style={{ height: "360px", width: "100%", zIndex: 1 }}
        className="rounded-2xl"
      >
        <ThemeWatcher isDark={isDark} />
        <Circle {...circleOptions} />
        <Marker position={[SCHOOL_LAT, SCHOOL_LNG]} icon={icon}>
          <Popup className={`custom-map-popup ${isDark ? "dark-popup" : "light-popup"}`} maxWidth={280} minWidth={220}>
            <div className="p-1">
              <div className="flex items-center gap-2 mb-1.5">
                <MapPin size={16} className="text-primary shrink-0" />
                <h4 className="font-bold text-sm leading-tight">{SCHOOL_NAME}</h4>
              </div>
              <p className="text-xs opacity-70 mb-1">{SCHOOL_ADDRESS}</p>
              <p className="text-xs font-medium opacity-80 mb-3">📘 SSC Science Coaching Location</p>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: isDark
                    ? "linear-gradient(135deg, #818cf8, #6366f1)"
                    : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "white",
                }}
              >
                <ExternalLink size={13} />
                Get Directions
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Pulse animation CSS */}
      <style>{`
        .custom-glow-marker {
          background: none !important;
          border: none !important;
        }
        .map-marker-glow {
          animation: marker-pulse 2.5s ease-in-out infinite;
        }
        @keyframes marker-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.08); filter: brightness(1.2); }
        }
        .custom-map-popup .leaflet-popup-content-wrapper {
          background: ${isDark ? "hsl(222 40% 12% / 0.95)" : "hsl(0 0% 100% / 0.95)"};
          color: ${isDark ? "hsl(210 40% 96%)" : "hsl(222 47% 11%)"};
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          border: 1px solid ${isDark ? "rgba(129,140,248,0.2)" : "rgba(124,58,237,0.15)"};
          backdrop-filter: blur(12px);
        }
        .custom-map-popup .leaflet-popup-tip {
          background: ${isDark ? "hsl(222 40% 12% / 0.95)" : "hsl(0 0% 100% / 0.95)"};
        }
        .leaflet-control-zoom a {
          background: ${isDark ? "hsl(222 40% 15%) !important" : "white !important"};
          color: ${isDark ? "hsl(210 40% 90%) !important" : "hsl(222 47% 11%) !important"};
          border-color: ${isDark ? "hsl(222 30% 25%) !important" : "hsl(220 13% 86%) !important"};
        }
      `}</style>
    </div>
  );
};

export default LocationMap;
