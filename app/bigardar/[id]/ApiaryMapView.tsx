"use client";

import ApiaryMap from "@/components/maps/ApiaryMap";

interface ApiaryMapViewProps {
  latitude: number | null;
  longitude: number | null;
}

export default function ApiaryMapView({
  latitude,
  longitude,
}: ApiaryMapViewProps) {
  if (!latitude || !longitude) {
    return (
      <div className="w-full h-full bg-amber-50 flex items-center justify-center">
        <p className="text-amber-600">Ingen position angiven</p>
      </div>
    );
  }

  return (
    <ApiaryMap
      latitude={latitude}
      longitude={longitude}
      interactive={false}
    />
  );
}
