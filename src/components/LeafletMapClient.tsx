import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SCHOOL_LAT = 24.427541;
const SCHOOL_LNG = 90.780505;
const SCHOOL_NAME = "Zilla Smarani Girls' High School";
const SCHOOL_ADDRESS = "Kishoreganj, Bangladesh";

const LeafletMapClient = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([SCHOOL_LAT, SCHOOL_LNG], 15);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const circle = L.circle([SCHOOL_LAT, SCHOOL_LNG], {
      radius: 250,
      color: "rgba(124,58,237,0.4)",
      weight: 1.5,
      dashArray: "6 4",
      fillColor: "rgba(124,58,237,0.06)",
      fillOpacity: 1,
    }).addTo(map);

    const marker = L.marker([SCHOOL_LAT, SCHOOL_LNG], {
      icon: L.divIcon({
        html: `<div style="width: 40px; height: 52px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
            <circle cx="20" cy="20" r="18" fill="rgba(124,58,237,0.3)" opacity="0.5"/>
            <circle cx="20" cy="20" r="10" fill="#7c3aed"/>
            <circle cx="20" cy="20" r="5" fill="white" opacity="0.9"/>
            <path d="M20 30 L20 48" stroke="#7c3aed" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
            <circle cx="20" cy="48" r="2.5" fill="#7c3aed" opacity="0.5"/>
          </svg>
        </div>`,
        className: "custom-marker",
        iconSize: [40, 52],
        iconAnchor: [20, 52],
        popupAnchor: [0, -52],
      }),
    }).addTo(map);

    marker.bindPopup(
      `<div style="font-family: 'Space Grotesk', sans-serif;">
        <div style="font-weight: 700; margin-bottom: 4px;">${SCHOOL_NAME}</div>
        <div style="font-size: 12px; opacity: 0.75; margin-bottom: 6px;">${SCHOOL_ADDRESS}</div>
        <div style="font-size: 12px; font-weight: 600; margin-bottom: 10px;">📘 SSC Science Coaching Location</div>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=${SCHOOL_LAT},${SCHOOL_LNG}"
          target="_blank"
          rel="noopener noreferrer"
          style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;font-size:12px;font-weight:600;text-decoration:none;"
        >
          Get Directions
        </a>
      </div>`
    );

    return () => {
      circle.remove();
      marker.remove();
      map.remove();
    };
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-lg">
      <div ref={mapRef} style={{ height: "360px", width: "100%" }} className="rounded-2xl" />
    </div>
  );
};

export default LeafletMapClient;
