import { useEffect, useState } from "react";

const SCHOOL_LAT = 24.427541;
const SCHOOL_LNG = 90.780505;
const SCHOOL_NAME = "Zilla Smarani Girls' High School";
const SCHOOL_ADDRESS = "Kishoreganj, Bangladesh";

const LocationMap = () => {
  const [mapComponents, setMapComponents] = useState<any>(null);
  const [leaflet, setLeaflet] = useState<any>(null);

  useEffect(() => {
    // Dynamic import of leaflet CSS
    import("leaflet/dist/leaflet.css");

    // Dynamic import of react-leaflet components
    Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([reactLeaflet, L]) => {
      setMapComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker,
        Circle: reactLeaflet.Circle,
        Popup: reactLeaflet.Popup,
        useMap: reactLeaflet.useMap
      });
      setLeaflet(L.default);
    });
  }, []);

  if (!mapComponents || !leaflet) {
    return (
      <div className="glass-card rounded-2xl h-[360px] flex items-center justify-center text-muted-foreground">
        Loading map...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Circle, Popup } = mapComponents;

  // Create custom marker icon
  const customIcon = leaflet.divIcon({
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
  });

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-lg">
      <MapContainer
        center={[SCHOOL_LAT, SCHOOL_LNG]}
        zoom={15}
        scrollWheelZoom={true}
        style={{ height: "360px", width: "100%" }}
        className="rounded-2xl"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        <Circle
          center={[SCHOOL_LAT, SCHOOL_LNG]}
          radius={250}
          pathOptions={{
            color: "rgba(124,58,237,0.4)",
            fillColor: "rgba(124,58,237,0.06)",
            fillOpacity: 1,
            weight: 1.5,
            dashArray: "6 4",
          }}
        />
        <Marker position={[SCHOOL_LAT, SCHOOL_LNG]} icon={customIcon}>
          <Popup>
            <div className="p-2">
              <h4 className="font-bold text-sm mb-1">{SCHOOL_NAME}</h4>
              <p className="text-xs opacity-70 mb-1">{SCHOOL_ADDRESS}</p>
              <p className="text-xs font-medium opacity-80 mb-2">📘 SSC Science Coaching Location</p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${SCHOOL_LAT},${SCHOOL_LNG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground"
              >
                Get Directions
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LocationMap;
