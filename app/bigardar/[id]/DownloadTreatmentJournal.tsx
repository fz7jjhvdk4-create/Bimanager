"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { FileHeart, Loader2 } from "lucide-react";
import TreatmentJournalPDF, {
  type JournalRad,
} from "@/components/pdf/TreatmentJournalPDF";

interface DownloadTreatmentJournalProps {
  bigardId: string;
  bigardNamn: string;
}

interface HealthEvent {
  datum: string;
  data: string | null;
  samhalle: {
    namn: string;
    bigard: { id: string };
  };
}

export default function DownloadTreatmentJournal({
  bigardId,
  bigardNamn,
}: DownloadTreatmentJournalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ar = new Date().getFullYear();

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/events?handelseTyp=Hälsoåtgärd");
      if (!res.ok) throw new Error("Kunde inte hämta hälsoåtgärder");
      const events: HealthEvent[] = await res.json();

      const rader: JournalRad[] = events
        .filter(
          (e) =>
            e.samhalle?.bigard?.id === bigardId &&
            new Date(e.datum).getFullYear() === ar
        )
        .sort((a, b) => a.datum.localeCompare(b.datum))
        .map((e) => {
          let data: Record<string, unknown> = {};
          try {
            if (e.data) data = JSON.parse(e.data);
          } catch {
            // ogiltig JSON — visa raden utan detaljer
          }
          return {
            datum: new Date(e.datum).toLocaleDateString("sv-SE"),
            samhalle: e.samhalle.namn,
            atgard: String(data.atgardstyp ?? "Hälsoåtgärd"),
            preparat: data.metodPreparat ? String(data.metodPreparat) : undefined,
            batchnummer: data.batchnummer ? String(data.batchnummer) : undefined,
            karensDagar:
              typeof data.karensDagar === "number" ? data.karensDagar : undefined,
            anteckning: data.anteckningar ? String(data.anteckningar) : undefined,
          };
        });

      const blob = await pdf(
        <TreatmentJournalPDF bigardNamn={bigardNamn} ar={ar} rader={rader} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `behandlingsjournal-${bigardNamn.toLowerCase().replace(/\s+/g, "-")}-${ar}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating treatment journal:", err);
      setError(
        err instanceof Error ? err.message : "Kunde inte generera journalen"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--card-bg)] px-4 py-2 text-[var(--muted)] font-medium ring-1 ring-[var(--card-border)] hover:bg-[var(--accent)]/10 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileHeart className="h-4 w-4" />
        )}
        Behandlingsjournal
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
