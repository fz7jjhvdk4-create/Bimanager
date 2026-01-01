"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Clock, MapPin, Hexagon, RefreshCw } from "lucide-react";

interface Reminder {
  id: string;
  titel: string;
  beskrivning: string | null;
  datum: Date;
  paminnaFor: number;
  kategori: string;
  upprepning: string | null;
  samhalle: {
    id: string;
    namn: string;
    bigard: { id: string; namn: string };
  } | null;
  bigard: {
    id: string;
    namn: string;
  } | null;
}

interface ReminderCardProps {
  reminder: Reminder;
  categoryColor: string;
  isOverdue?: boolean;
  isToday?: boolean;
}

export default function ReminderCard({
  reminder,
  categoryColor,
  isOverdue = false,
  isToday = false,
}: ReminderCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reminders/${reminder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utford: true }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error completing reminder:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Är du säker på att du vill ta bort denna påminnelse?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/reminders/${reminder.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
    } finally {
      setLoading(false);
    }
  };

  const daysUntil = Math.ceil(
    (new Date(reminder.datum).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div
      className={`bg-[var(--card-bg)] rounded-xl p-4 ring-1 ${
        isOverdue
          ? "ring-red-300 bg-red-50/50"
          : isToday
          ? "ring-amber-300 bg-amber-50/50"
          : "ring-[var(--card-border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${categoryColor}`} />
            <span className="text-xs font-medium text-[var(--muted)] uppercase">
              {reminder.kategori}
            </span>
            {reminder.upprepning && reminder.upprepning !== "Ingen" && (
              <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
                <RefreshCw className="h-3 w-3" />
                {reminder.upprepning}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-[var(--foreground)] mb-1">
            {reminder.titel}
          </h3>

          {reminder.beskrivning && (
            <p className="text-sm text-[var(--muted)] mb-2 line-clamp-2">
              {reminder.beskrivning}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`flex items-center gap-1 ${
                isOverdue ? "text-red-600" : isToday ? "text-amber-600" : "text-[var(--muted)]"
              }`}
            >
              <Clock className="h-4 w-4" />
              {new Date(reminder.datum).toLocaleDateString("sv-SE")}
              {isOverdue && ` (${Math.abs(daysUntil)} dagar sedan)`}
              {isToday && " (idag)"}
              {!isOverdue && !isToday && daysUntil <= 7 && ` (om ${daysUntil} dagar)`}
            </span>

            {reminder.samhalle && (
              <span className="flex items-center gap-1 text-[var(--muted)]">
                <Hexagon className="h-4 w-4" />
                {reminder.samhalle.namn}
              </span>
            )}

            {reminder.bigard && !reminder.samhalle && (
              <span className="flex items-center gap-1 text-[var(--muted)]">
                <MapPin className="h-4 w-4" />
                {reminder.bigard.namn}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleComplete}
            disabled={loading}
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
            title="Markera som utförd"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--card-bg)] text-red-500 ring-1 ring-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Ta bort"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
