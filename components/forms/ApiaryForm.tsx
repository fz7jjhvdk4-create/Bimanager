"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import ApiaryMap from "@/components/maps/ApiaryMap";

interface ApiaryFormProps {
  apiary?: {
    id: string;
    namn: string;
    adress: string | null;
    latitude: number | null;
    longitude: number | null;
    beskrivning: string | null;
  };
}

export default function ApiaryForm({ apiary }: ApiaryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    namn: apiary?.namn || "",
    adress: apiary?.adress || "",
    latitude: apiary?.latitude || null,
    longitude: apiary?.longitude || null,
    beskrivning: apiary?.beskrivning || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = apiary
        ? `/api/apiaries/${apiary.id}`
        : "/api/apiaries";
      const method = apiary ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Något gick fel");
      }

      router.push("/bigardar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <Input
        label="Namn *"
        value={formData.namn}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, namn: e.target.value }))
        }
        placeholder="T.ex. Krattorp Eken"
        required
      />

      <Input
        label="Adress"
        value={formData.adress}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, adress: e.target.value }))
        }
        placeholder="T.ex. Krattorpsvägen 12, 123 45 Ort"
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-amber-800">
          Plats på karta
        </label>
        <p className="text-sm text-amber-600">
          Klicka på kartan för att välja position, eller dra markören för att justera.
        </p>
        <div className="h-[400px] rounded-lg border border-amber-200 overflow-hidden">
          <ApiaryMap
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={handleLocationChange}
            interactive={true}
          />
        </div>
        {formData.latitude && formData.longitude && (
          <p className="text-sm text-amber-600">
            Vald position: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
          </p>
        )}
      </div>

      <Textarea
        label="Beskrivning"
        value={formData.beskrivning}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, beskrivning: e.target.value }))
        }
        placeholder="Anteckningar om bigården..."
        rows={4}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" loading={loading}>
          {apiary ? "Spara ändringar" : "Skapa bigård"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Avbryt
        </Button>
      </div>
    </form>
  );
}
