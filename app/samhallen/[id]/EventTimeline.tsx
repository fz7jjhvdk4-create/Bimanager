"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { EventType } from "@/types";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { eventColors, eventIcons } from "@/components/events/eventStyle";

interface Event {
  id: string;
  handelseTyp: string;
  datum: Date | string;
  beskrivning: string | null;
  data: string | null;
  skapadDatum: Date | string;
}

interface EventTimelineProps {
  events: Event[];
  colonyId: string;
}

function EventCard({ event, onDelete }: { event: Event; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const Icon = eventIcons[event.handelseTyp as EventType] || FileText;
  const color = eventColors[event.handelseTyp as EventType] || "bg-stone-500";

  let parsedData: Record<string, string | number | boolean | undefined> = {};
  try {
    if (event.data) {
      parsedData = JSON.parse(event.data);
    }
  } catch {
    // ignore parse errors
  }

  const handleDelete = async () => {
    const response = await fetch(`/api/events/${event.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Kunde inte ta bort händelse");
    }
    onDelete();
  };

  const renderEventDetails = () => {
    switch (event.handelseTyp) {
      case "Inspektion":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {parsedData.styrka && (
              <div>
                <span className="text-[var(--accent-hover)]">Styrka:</span>{" "}
                <span className="font-medium">{String(parsedData.styrka)}</span>
              </div>
            )}
            {parsedData.temperament && (
              <div>
                <span className="text-[var(--accent-hover)]">Temperament:</span>{" "}
                <span className="font-medium">{String(parsedData.temperament)}</span>
              </div>
            )}
            <div>
              <span className="text-[var(--accent-hover)]">Drottning synlig:</span>{" "}
              <span className="font-medium">
                {parsedData.drottningSynlig ? "Ja" : "Nej"}
              </span>
            </div>
            <div>
              <span className="text-[var(--accent-hover)]">Drottningceller:</span>{" "}
              <span className="font-medium">
                {parsedData.drottningceller ? "Ja" : "Nej"}
              </span>
            </div>
            {parsedData.vader != null &&
              (() => {
                const vader = parsedData.vader as unknown as {
                  temperatur?: number;
                  vind?: number;
                  text?: string;
                };
                return (
                  <div className="col-span-2">
                    <span className="text-[var(--accent-hover)]">Väder:</span>{" "}
                    <span className="font-medium">
                      {vader.text}, {Math.round(vader.temperatur ?? 0)}°C,{" "}
                      {Math.round(vader.vind ?? 0)} m/s
                    </span>
                  </div>
                );
              })()}
          </div>
        );

      case "Varroamätning":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {parsedData.metod && (
              <div>
                <span className="text-[var(--accent-hover)]">Metod:</span>{" "}
                <span className="font-medium">{String(parsedData.metod)}</span>
              </div>
            )}
            {parsedData.antalKvalster !== undefined && (
              <div>
                <span className="text-[var(--accent-hover)]">Kvalster:</span>{" "}
                <span className="font-medium">
                  {String(parsedData.antalKvalster)}
                </span>
              </div>
            )}
            {parsedData.nedfallPerDygn !== undefined && (
              <div>
                <span className="text-[var(--accent-hover)]">Per dygn:</span>{" "}
                <span className="font-medium">
                  {String(parsedData.nedfallPerDygn)}
                </span>
              </div>
            )}
            {parsedData.angreppsgrad !== undefined && (
              <div>
                <span className="text-[var(--accent-hover)]">Angreppsgrad:</span>{" "}
                <span className="font-medium">
                  {String(parsedData.angreppsgrad)} %
                </span>
              </div>
            )}
          </div>
        );

      case "Utfodring":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {parsedData.fodertyp && (
              <div>
                <span className="text-[var(--accent-hover)]">Fodertyp:</span>{" "}
                <span className="font-medium">{String(parsedData.fodertyp)}</span>
              </div>
            )}
            {parsedData.mangdKg !== undefined && (
              <div>
                <span className="text-[var(--accent-hover)]">Mängd:</span>{" "}
                <span className="font-medium">{String(parsedData.mangdKg)} kg</span>
              </div>
            )}
            {parsedData.syfte && (
              <div>
                <span className="text-[var(--accent-hover)]">Syfte:</span>{" "}
                <span className="font-medium">{String(parsedData.syfte)}</span>
              </div>
            )}
          </div>
        );

      case "Skörd":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {parsedData.mangdKg && (
              <div>
                <span className="text-[var(--accent-hover)]">Mängd:</span>{" "}
                <span className="font-medium">{parsedData.mangdKg} kg</span>
              </div>
            )}
            {parsedData.antalRamar && (
              <div>
                <span className="text-[var(--accent-hover)]">Antal ramar:</span>{" "}
                <span className="font-medium">{parsedData.antalRamar}</span>
              </div>
            )}
          </div>
        );

      case "Invintring":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {parsedData.antalRamar && (
              <div>
                <span className="text-[var(--accent-hover)]">Antal ramar:</span>{" "}
                <span className="font-medium">{parsedData.antalRamar}</span>
              </div>
            )}
            {parsedData.fodermangdKg && (
              <div>
                <span className="text-[var(--accent-hover)]">Foder:</span>{" "}
                <span className="font-medium">{parsedData.fodermangdKg} kg</span>
              </div>
            )}
            {parsedData.allmanntSkick && (
              <div>
                <span className="text-[var(--accent-hover)]">Skick:</span>{" "}
                <span className="font-medium">{String(parsedData.allmanntSkick)}</span>
              </div>
            )}
          </div>
        );

      case "Hälsoåtgärd":
        return (
          <div className="space-y-1 text-sm">
            {parsedData.atgardstyp && (
              <div>
                <span className="text-[var(--accent-hover)]">Typ:</span>{" "}
                <span className="font-medium">{String(parsedData.atgardstyp)}</span>
              </div>
            )}
            {parsedData.metodPreparat && (
              <div>
                <span className="text-[var(--accent-hover)]">Metod/preparat:</span>{" "}
                <span className="font-medium">{String(parsedData.metodPreparat)}</span>
              </div>
            )}
            {parsedData.batchnummer && (
              <div>
                <span className="text-[var(--accent-hover)]">Batchnr:</span>{" "}
                <span className="font-medium">{String(parsedData.batchnummer)}</span>
              </div>
            )}
            {parsedData.karensDagar !== undefined && parsedData.karensDagar !== 0 && (
              <div>
                <span className="text-[var(--accent-hover)]">Karens:</span>{" "}
                <span className="font-medium">{String(parsedData.karensDagar)} dagar</span>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const hasDetails =
    Object.keys(parsedData).filter((k) => k !== "anteckningar").length > 0;
  const hasNotes = parsedData.anteckningar;

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-[var(--accent)]/20" />

      {/* Icon */}
      <div
        className={`absolute left-0 flex h-6 w-6 items-center justify-center rounded-full ${color}`}
      >
        <Icon className="h-3 w-3 text-white" />
      </div>

      {/* Card */}
      <div className="bg-[var(--background)] rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--foreground)]">
                {event.handelseTyp}
              </span>
              <span className="text-sm text-[var(--accent)]">
                {new Date(event.datum).toLocaleDateString("sv-SE")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(hasDetails || hasNotes) && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 text-[var(--accent)] hover:text-[var(--accent-hover)] rounded"
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-1 text-red-400 hover:text-red-600 rounded"
              title="Ta bort"
              aria-label="Ta bort händelse"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            {hasDetails && renderEventDetails()}
            {hasNotes && (
              <div className="text-sm">
                <span className="text-[var(--accent-hover)]">Anteckningar:</span>
                <p className="mt-1 text-[var(--foreground)] whitespace-pre-wrap">
                  {String(parsedData.anteckningar)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Ta bort händelse"
        message={
          <p>
            Är du säker på att du vill ta bort händelsen{" "}
            <strong>{event.handelseTyp}</strong> från{" "}
            {new Date(event.datum).toLocaleDateString("sv-SE")}? Detta går inte
            att ångra.
          </p>
        }
      />
    </div>
  );
}

export default function EventTimeline({ events, colonyId }: EventTimelineProps) {
  const router = useRouter();

  const handleDelete = () => {
    router.refresh();
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-[var(--accent)]/40 mx-auto mb-3" />
        <p className="text-[var(--accent-hover)]">
          Inga händelser registrerade för detta samhälle ännu.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {events.map((event) => (
        <EventCard key={event.id} event={event} onDelete={handleDelete} />
      ))}
    </div>
  );
}
