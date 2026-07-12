"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { markfarg } from "@/lib/drottning";
import { QUEEN_ORIGINS, QUEEN_RACES } from "@/types";

interface QueenRad {
  id: string;
  ras: string | null;
  ar: number | null;
  vingklippt: boolean;
  ursprung: string | null;
  status: string;
  installeradDatum: string;
  avslutadDatum: string | null;
}

interface QueenCardProps {
  colonyId: string;
  drottningRas: string | null;
  drottningAr: number | null;
  drottningVingklippt: boolean;
  queens: QueenRad[];
}

function FargPrick({ ar }: { ar: number | null }) {
  const farg = markfarg(ar);
  if (!farg) return null;
  return (
    <span
      className={`inline-block h-3.5 w-3.5 rounded-full ${farg.cssKlass}`}
      title={`Märkfärg: ${farg.namn}`}
      aria-label={`Märkfärg: ${farg.namn}`}
    />
  );
}

const statusBadge: Record<string, string> = {
  Aktiv: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Ersatt: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Död: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  Försvunnen: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
};

export default function QueenCard({
  colonyId,
  drottningRas,
  drottningAr,
  drottningVingklippt,
  queens,
}: QueenCardProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showHistorik, setShowHistorik] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    ras: "",
    ar: new Date().getFullYear().toString(),
    vingklippt: false,
    ursprung: "",
    installeradDatum: new Date().toISOString().split("T")[0],
    gammalStatus: "Ersatt",
    anteckningar: "",
  });

  const harNuvarande = Boolean(drottningRas || drottningAr);
  const historik = queens.filter((q) => q.status !== "Aktiv");

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/colonies/${colonyId}/queens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ras: form.ras,
          ar: form.ar ? parseInt(form.ar) : null,
          vingklippt: form.vingklippt,
          ursprung: form.ursprung,
          installeradDatum: form.installeradDatum,
          gammalStatus: form.gammalStatus,
          anteckningar: form.anteckningar,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Kunde inte byta drottning");
      }
      setShowModal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-[var(--accent-hover)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Drottning
          </h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-sm text-[var(--accent-hover)] hover:text-[var(--accent)] transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Byt drottning
        </button>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-[var(--accent-hover)]">Ras</dt>
          <dd className="font-medium text-[var(--foreground)]">
            {drottningRas || "-"}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--accent-hover)]">Märkningsår</dt>
          <dd className="flex items-center gap-2 font-medium text-[var(--foreground)]">
            <FargPrick ar={drottningAr} />
            {drottningAr || "-"}
            {markfarg(drottningAr) && (
              <span className="text-xs text-[var(--muted)]">
                ({markfarg(drottningAr)!.namn})
              </span>
            )}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--accent-hover)]">Vingklippt</dt>
          <dd className="font-medium text-[var(--foreground)]">
            {drottningVingklippt ? "Ja" : "Nej"}
          </dd>
        </div>
      </dl>

      {historik.length > 0 && (
        <div className="mt-4 border-t border-[var(--card-border)] pt-3">
          <button
            onClick={() => setShowHistorik(!showHistorik)}
            className="text-sm text-[var(--accent-hover)] hover:text-[var(--accent)]"
          >
            {showHistorik ? "Dölj historik" : `Historik (${historik.length})`}
          </button>
          {showHistorik && (
            <ul className="mt-2 space-y-2">
              {historik.map((q) => (
                <li key={q.id} className="flex items-center gap-2 text-sm">
                  <FargPrick ar={q.ar} />
                  <span className="text-[var(--foreground)]">
                    {q.ras || "Okänd ras"}
                    {q.ar ? ` (${q.ar})` : ""}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(q.installeradDatum).toLocaleDateString("sv-SE")}
                    {q.avslutadDatum &&
                      ` – ${new Date(q.avslutadDatum).toLocaleDateString("sv-SE")}`}
                  </span>
                  <span
                    className={`ml-auto px-1.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[q.status] || statusBadge["Försvunnen"]}`}
                  >
                    {q.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Byt drottning"
      >
        <div className="space-y-4">
          {harNuvarande && (
            <Select
              label="Vad hände med förra drottningen?"
              value={form.gammalStatus}
              onChange={(e) =>
                setForm((f) => ({ ...f, gammalStatus: e.target.value }))
              }
              options={[
                { value: "Ersatt", label: "Ersatt (planerat byte)" },
                { value: "Död", label: "Död" },
                { value: "Försvunnen", label: "Försvunnen/svärmad" },
              ]}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ny drottnings ras"
              value={form.ras}
              onChange={(e) => setForm((f) => ({ ...f, ras: e.target.value }))}
              options={QUEEN_RACES.map((r) => ({ value: r, label: r }))}
              placeholder="Välj..."
            />
            <Input
              label="Födelseår"
              type="number"
              value={form.ar}
              onChange={(e) => setForm((f) => ({ ...f, ar: e.target.value }))}
            />
          </div>

          {form.ar && markfarg(parseInt(form.ar)) && (
            <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <FargPrick ar={parseInt(form.ar)} />
              Märkfärg: {markfarg(parseInt(form.ar))!.namn}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ursprung"
              value={form.ursprung}
              onChange={(e) =>
                setForm((f) => ({ ...f, ursprung: e.target.value }))
              }
              options={QUEEN_ORIGINS.map((u) => ({ value: u, label: u }))}
              placeholder="Välj..."
            />
            <Input
              label="Datum"
              type="date"
              value={form.installeradDatum}
              onChange={(e) =>
                setForm((f) => ({ ...f, installeradDatum: e.target.value }))
              }
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.vingklippt}
              onChange={(e) =>
                setForm((f) => ({ ...f, vingklippt: e.target.checked }))
              }
              className="h-4 w-4 rounded border-[var(--input-border)] text-[var(--accent)] focus:ring-amber-500"
            />
            <span className="text-sm text-[var(--foreground)]">Vingklippt</span>
          </label>

          <Textarea
            label="Anteckningar"
            rows={2}
            value={form.anteckningar}
            onChange={(e) =>
              setForm((f) => ({ ...f, anteckningar: e.target.value }))
            }
            placeholder="T.ex. leverantör, parningsplats..."
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm dark:bg-red-950 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit} loading={loading}>
              Byt drottning
            </Button>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Avbryt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
