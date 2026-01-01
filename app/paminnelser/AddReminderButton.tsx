"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { REMINDER_CATEGORIES, REMINDER_REPETITIONS } from "@/types";

interface Apiary {
  id: string;
  namn: string;
}

interface Colony {
  id: string;
  namn: string;
  bigard: { id: string; namn: string };
}

interface AddReminderButtonProps {
  apiaries: Apiary[];
  colonies: Colony[];
}

export default function AddReminderButton({
  apiaries,
  colonies,
}: AddReminderButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [titel, setTitel] = useState("");
  const [beskrivning, setBeskrivning] = useState("");
  const [datum, setDatum] = useState(new Date().toISOString().split("T")[0]);
  const [paminnaFor, setPaminnaFor] = useState("1");
  const [kategori, setKategori] = useState("");
  const [kopplaTill, setKopplaTill] = useState<"ingen" | "samhalle" | "bigard">("ingen");
  const [samhalleId, setSamhalleId] = useState("");
  const [bigardId, setBigardId] = useState("");
  const [upprepning, setUpprepning] = useState("Ingen");

  const resetForm = () => {
    setTitel("");
    setBeskrivning("");
    setDatum(new Date().toISOString().split("T")[0]);
    setPaminnaFor("1");
    setKategori("");
    setKopplaTill("ingen");
    setSamhalleId("");
    setBigardId("");
    setUpprepning("Ingen");
    setError(null);
  };

  const handleClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!titel || !kategori || !datum) {
      setError("Titel, kategori och datum är obligatoriska");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titel,
          beskrivning: beskrivning || null,
          datum,
          paminnaFor: parseInt(paminnaFor),
          kategori,
          samhalleId: kopplaTill === "samhalle" ? samhalleId : null,
          bigardId: kopplaTill === "bigard" ? bigardId : null,
          upprepning: upprepning !== "Ingen" ? upprepning : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Något gick fel");
      }

      handleClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-white font-medium hover:bg-[var(--accent-hover)] transition-colors"
      >
        <Plus className="h-4 w-4" />
        Ny påminnelse
      </button>

      <Modal isOpen={showModal} onClose={handleClose} title="Ny påminnelse" size="lg">
        <div className="space-y-4">
          <Input
            label="Titel"
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder="T.ex. Varroabehandling höst"
            required
          />

          <Textarea
            label="Beskrivning (valfritt)"
            value={beskrivning}
            onChange={(e) => setBeskrivning(e.target.value)}
            placeholder="Lägg till mer information..."
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Datum"
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              required
            />

            <Select
              label="Kategori"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              options={REMINDER_CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder="Välj kategori..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Påminn dagar innan"
              type="number"
              min="0"
              value={paminnaFor}
              onChange={(e) => setPaminnaFor(e.target.value)}
            />

            <Select
              label="Upprepning"
              value={upprepning}
              onChange={(e) => setUpprepning(e.target.value)}
              options={REMINDER_REPETITIONS.map((r) => ({ value: r, label: r }))}
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Koppla till (valfritt)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kopplaTill"
                  checked={kopplaTill === "ingen"}
                  onChange={() => setKopplaTill("ingen")}
                  className="h-4 w-4 text-[var(--accent)]"
                />
                <span className="text-sm text-[var(--foreground)]">Ingen</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kopplaTill"
                  checked={kopplaTill === "samhalle"}
                  onChange={() => setKopplaTill("samhalle")}
                  className="h-4 w-4 text-[var(--accent)]"
                />
                <span className="text-sm text-[var(--foreground)]">Samhälle</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kopplaTill"
                  checked={kopplaTill === "bigard"}
                  onChange={() => setKopplaTill("bigard")}
                  className="h-4 w-4 text-[var(--accent)]"
                />
                <span className="text-sm text-[var(--foreground)]">Bigård</span>
              </label>
            </div>

            {kopplaTill === "samhalle" && (
              <Select
                value={samhalleId}
                onChange={(e) => setSamhalleId(e.target.value)}
                options={colonies.map((c) => ({
                  value: c.id,
                  label: `${c.namn} (${c.bigard.namn})`,
                }))}
                placeholder="Välj samhälle..."
              />
            )}

            {kopplaTill === "bigard" && (
              <Select
                value={bigardId}
                onChange={(e) => setBigardId(e.target.value)}
                options={apiaries.map((a) => ({
                  value: a.id,
                  label: a.namn,
                }))}
                placeholder="Välj bigård..."
              />
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} loading={loading}>
              Spara
            </Button>
            <Button variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
