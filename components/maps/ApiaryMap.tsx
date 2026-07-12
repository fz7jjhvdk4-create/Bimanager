"use client";

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
      <div className="w-full h-full bg-[var(--accent)]/10 flex items-center justify-center rounded-lg">
        <div className="text-[var(--accent-hover)]">Laddar karta...</div>
      </div>
    ),
  }
);

export default function ApiaryMap(props: ApiaryMapProps) {
  return <MapComponent {...props} />;
}
