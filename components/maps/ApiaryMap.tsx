"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface ApiaryMapProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange?: (lat: number, lng: number) => void;
  interactive?: boolean;
  markers?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
  }>;
}

// Dynamically import the map to avoid SSR issues with Leaflet
const MapComponent = dynamic(
  () => import("./MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-amber-50 flex items-center justify-center rounded-lg">
        <div className="text-amber-600">Laddar karta...</div>
      </div>
    ),
  }
);

export default function ApiaryMap(props: ApiaryMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-amber-50 flex items-center justify-center rounded-lg">
        <div className="text-amber-600">Laddar karta...</div>
      </div>
    );
  }

  return <MapComponent {...props} />;
}
