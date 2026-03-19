import { useEffect, useState } from "react";

const LocationMap = () => {
  const [LeafletMap, setLeafletMap] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    let mounted = true;
    import("./LeafletMapClient").then((mod) => {
      if (mounted) setLeafletMap(() => mod.default);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!LeafletMap) {
    return (
      <div className="glass-card rounded-2xl h-[360px] flex items-center justify-center text-muted-foreground">
        Loading map...
      </div>
    );
  }

  return <LeafletMap />;
};

export default LocationMap;
