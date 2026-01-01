"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import {
  COLONY_STATUSES,
  HIVE_TYPES,
  FRAME_TYPES,
  QUEEN_RACES,
} from "@/types";

interface Apiary {
  id: string;
  namn: string;
}

interface ColonyFormProps {
  apiaries: Apiary[];
  defaultApiaryId?: string;
  colony?: {
    id: string;
    bigardId: string;
    namn: string;
    platsNummer: number | null;
    drottningRas: string | null;
    drottningAr: number | null;
    drottningVingklippt: boolean;
    kupaTyp: string | null;
    ramTypYngelrum: string | null;
    ramTypSkattlador: string | null;
    status: string;
    anteckningar: string | null;
  };
}

export default function ColonyForm({
  apiaries,
  defaultApiaryId,
  colony,
}: ColonyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bigardId: colony?.bigardId || defaultApiaryId || "",
    namn: colony?.namn || "",
    platsNummer: colony?.platsNummer?.toString() || "",
    drottningRas: colony?.drottningRas || "",
    drottningAr: colony?.drottningAr?.toString() || "",
    drottningVingklippt: colony?.drottningVingklippt || false,
    kupaTyp: colony?.kupaTyp || "",
    ramTypYngelrum: colony?.ramTypYngelrum || "",
    ramTypSkattlador: colony?.ramTypSkattlador || "",
    status: colony?.status || "Aktiv",
    anteckningar: colony?.anteckningar || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        platsNummer: formData.platsNummer
          ? parseInt(formData.platsNummer)
          : null,
        drottningAr: formData.drottningAr
          ? parseInt(formData.drottningAr)
          : null,
      };

      const url = colony ? `/api/colonies/${colony.id}` : "/api/colonies";
      const method = colony ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Något gick fel");
      }

      const result = await response.json();
      router.push(`/samhallen/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  const apiaryOptions = apiaries.map((a) => ({
    value: a.id,
    label: a.namn,
  }));

  const statusOptions = COLONY_STATUSES.map((s) => ({
    value: s,
    label: s,
  }));

  const hiveOptions = [
    { value: "", label: "Välj kuptyp..." },
    ...HIVE_TYPES.map((t) => ({ value: t, label: t })),
  ];

  const frameOptions = [
    { value: "", label: "Välj ramtyp..." },
    ...FRAME_TYPES.map((t) => ({ value: t, label: t })),
  ];

  const queenRaceOptions = [
    { value: "", label: "Välj ras..." },
    ...QUEEN_RACES.map((r) => ({ value: r, label: r })),
  ];

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: "", label: "Välj år..." },
    ...Array.from({ length: 10 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString(),
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
          Grundinfo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Bigård *"
            value={formData.bigardId}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, bigardId: e.target.value }))
            }
            options={apiaryOptions}
            placeholder="Välj bigård..."
            required
          />

          <Input
            label="Namn *"
            value={formData.namn}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, namn: e.target.value }))
            }
            placeholder="T.ex. Krattorp 1"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Platsnummer"
            type="number"
            value={formData.platsNummer}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, platsNummer: e.target.value }))
            }
            placeholder="T.ex. 1"
            min={1}
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, status: e.target.value }))
            }
            options={statusOptions}
          />
        </div>
      </div>

      {/* Queen Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
          Drottning
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Ras"
            value={formData.drottningRas}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, drottningRas: e.target.value }))
            }
            options={queenRaceOptions}
          />

          <Select
            label="Märkningsår"
            value={formData.drottningAr}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, drottningAr: e.target.value }))
            }
            options={yearOptions}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="drottningVingklippt"
            checked={formData.drottningVingklippt}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                drottningVingklippt: e.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
          />
          <label
            htmlFor="drottningVingklippt"
            className="text-sm text-amber-800"
          >
            Vingklippt
          </label>
        </div>
      </div>

      {/* Hive Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
          Kupa
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Kuptyp"
            value={formData.kupaTyp}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, kupaTyp: e.target.value }))
            }
            options={hiveOptions}
          />

          <Select
            label="Ramtyp yngelrum"
            value={formData.ramTypYngelrum}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                ramTypYngelrum: e.target.value,
              }))
            }
            options={frameOptions}
          />

          <Select
            label="Ramtyp skattlådor"
            value={formData.ramTypSkattlador}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                ramTypSkattlador: e.target.value,
              }))
            }
            options={frameOptions}
          />
        </div>
      </div>

      {/* Notes */}
      <Textarea
        label="Anteckningar"
        value={formData.anteckningar}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, anteckningar: e.target.value }))
        }
        placeholder="Övriga anteckningar om samhället..."
        rows={4}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" loading={loading}>
          {colony ? "Spara ändringar" : "Skapa samhälle"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Avbryt
        </Button>
      </div>
    </form>
  );
}
