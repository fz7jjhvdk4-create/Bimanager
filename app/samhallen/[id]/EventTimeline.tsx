"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Scale,
  Snowflake,
  GitBranch,
  Heart,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { EventType } from "@/types";

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

const eventIcons: Record<EventType, React.ElementType> = {
  Inspektion: ClipboardCheck,
  Skörd: Scale,
  Invintring: Snowflake,
  Avläggare: GitBranch,
  Hälsoåtgärd: Heart,
  Anteckning: FileText,
};

const eventColors: Record<EventType, string> = {
  Inspektion: "bg-blue-500",
  Skörd: "bg-yellow-500",
  Invintring: "bg-cyan-500",
  Avläggare: "bg-purple-500",
  Hälsoåtgärd: "bg-rose-500",
  Anteckning: "bg-stone-500",
};

function EventCard({ event, onDelete }: { event: Event; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    if (!confirm("Är du säker på att du vill ta bort denna händelse?")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onDelete();
      }
    } catch {
      // ignore errors
    }
    setDeleting(false);
  };

  const renderEventDetails = () => {
    switch (event.handelseTyp) {
      case "Inspektion":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {parsedData.styrka && (
              <div>
                <span className="text-amber-600">Styrka:</span>{" "}
                <span className="font-medium">{String(parsedData.styrka)}</span>
              </div>
            )}
            {parsedData.temperament && (
              <div>
                <span className="text-amber-600">Temperament:</span>{" "}
                <span className="font-medium">{String(parsedData.temperament)}</span>
              </div>
            )}
            <div>
              <span className="text-amber-600">Drottning synlig:</span>{" "}
              <span className="font-medium">
                {parsedData.drottningSynlig ? "Ja" : "Nej"}
              </span>
            </div>
            <div>
              <span className="text-amber-600">Drottningceller:</span>{" "}
              <span className="font-medium">
                {parsedData.drottningceller ? "Ja" : "Nej"}
              </span>
            </div>
          </div>
        );

      case "Skörd":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            {parsedData.mangdKg && (
              <div>
                <span className="text-amber-600">Mängd:</span>{" "}
                <span className="font-medium">{parsedData.mangdKg} kg</span>
              </div>
            )}
            {parsedData.antalRamar && (
              <div>
                <span className="text-amber-600">Antal ramar:</span>{" "}
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
                <span className="text-amber-600">Antal ramar:</span>{" "}
                <span className="font-medium">{parsedData.antalRamar}</span>
              </div>
            )}
            {parsedData.fodermangdKg && (
              <div>
                <span className="text-amber-600">Foder:</span>{" "}
                <span className="font-medium">{parsedData.fodermangdKg} kg</span>
              </div>
            )}
            {parsedData.allmanntSkick && (
              <div>
                <span className="text-amber-600">Skick:</span>{" "}
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
                <span className="text-amber-600">Typ:</span>{" "}
                <span className="font-medium">{String(parsedData.atgardstyp)}</span>
              </div>
            )}
            {parsedData.metodPreparat && (
              <div>
                <span className="text-amber-600">Metod/preparat:</span>{" "}
                <span className="font-medium">{String(parsedData.metodPreparat)}</span>
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
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-amber-100" />

      {/* Icon */}
      <div
        className={`absolute left-0 flex h-6 w-6 items-center justify-center rounded-full ${color}`}
      >
        <Icon className="h-3 w-3 text-white" />
      </div>

      {/* Card */}
      <div className="bg-stone-50 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-amber-900">
                {event.handelseTyp}
              </span>
              <span className="text-sm text-amber-500">
                {new Date(event.datum).toLocaleDateString("sv-SE")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(hasDetails || hasNotes) && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="p-1 text-amber-400 hover:text-amber-600 rounded"
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 text-red-400 hover:text-red-600 rounded disabled:opacity-50"
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
                <span className="text-amber-600">Anteckningar:</span>
                <p className="mt-1 text-amber-800 whitespace-pre-wrap">
                  {String(parsedData.anteckningar)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
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
        <FileText className="h-12 w-12 text-amber-200 mx-auto mb-3" />
        <p className="text-amber-600">
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
