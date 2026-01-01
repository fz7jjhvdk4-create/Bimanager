"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
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

// Fix Leaflet default marker icon issue
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "hue-rotate-[40deg] saturate-150",
});

export default function MapComponent({
  latitude,
  longitude,
  onLocationChange,
  interactive = true,
  markers = [],
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Default to Sweden center
  const defaultLat = 59.33;
  const defaultLng = 18.07;
  const defaultZoom = 5;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = latitude ?? defaultLat;
    const initialLng = longitude ?? defaultLng;
    const initialZoom = latitude && longitude ? 13 : defaultZoom;

    // Create map
    const map = L.map(containerRef.current).setView(
      [initialLat, initialLng],
      initialZoom
    );

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add existing markers
    markers.forEach((m) => {
      L.marker([m.lat, m.lng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(m.name);
    });

    // Add marker for current location if set
    if (latitude && longitude) {
      markerRef.current = L.marker([latitude, longitude], {
        icon: selectedIcon,
        draggable: interactive,
      }).addTo(map);

      if (interactive && onLocationChange) {
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current?.getLatLng();
          if (pos) {
            onLocationChange(pos.lat, pos.lng);
          }
        });
      }
    }

    // Handle click to place marker
    if (interactive && onLocationChange) {
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            icon: selectedIcon,
            draggable: true,
          }).addTo(map);

          markerRef.current.on("dragend", () => {
            const pos = markerRef.current?.getLatLng();
            if (pos) {
              onLocationChange(pos.lat, pos.lng);
            }
          });
        }

        onLocationChange(lat, lng);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // Only run once on mount

  // Update marker position when props change
  useEffect(() => {
    if (!mapRef.current) return;

    if (latitude && longitude) {
      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        markerRef.current = L.marker([latitude, longitude], {
          icon: selectedIcon,
          draggable: interactive,
        }).addTo(mapRef.current);

        if (interactive && onLocationChange) {
          markerRef.current.on("dragend", () => {
            const pos = markerRef.current?.getLatLng();
            if (pos) {
              onLocationChange(pos.lat, pos.lng);
            }
          });
        }
      }
      mapRef.current.setView([latitude, longitude], 13);
    }
  }, [latitude, longitude, interactive, onLocationChange]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[300px] rounded-lg overflow-hidden"
    />
  );
}
