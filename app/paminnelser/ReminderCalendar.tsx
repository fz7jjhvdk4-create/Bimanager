"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { sv } from "date-fns/locale";

interface KalenderPaminnelse {
  id: string;
  titel: string;
  datum: string; // ISO-sträng (serialiserad från serverkomponenten)
  kategori: string;
}

interface ReminderCalendarProps {
  reminders: KalenderPaminnelse[];
  categoryColors: Record<string, string>;
}

const VECKODAGAR = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

export default function ReminderCalendar({
  reminders,
  categoryColors,
}: ReminderCalendarProps) {
  const [manad, setManad] = useState(() => startOfMonth(new Date()));
  const [valdDag, setValdDag] = useState<Date | null>(null);

  const dagar = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(manad), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(manad), { weekStartsOn: 1 }),
      }),
    [manad]
  );

  const paminnelserPerDag = (dag: Date) =>
    reminders.filter((r) => isSameDay(new Date(r.datum), dag));

  const valda = valdDag ? paminnelserPerDag(valdDag) : [];

  return (
    <div className="bg-[var(--card-bg)] rounded-xl ring-1 ring-[var(--card-border)] p-4 sm:p-5">
      {/* Månadshuvud */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)] capitalize">
          {format(manad, "MMMM yyyy", { locale: sv })}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setManad((m) => addMonths(m, -1))}
            aria-label="Föregående månad"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setManad(startOfMonth(new Date()))}
            className="px-3 h-9 rounded-lg text-sm text-[var(--muted)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            Idag
          </button>
          <button
            type="button"
            onClick={() => setManad((m) => addMonths(m, 1))}
            aria-label="Nästa månad"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Veckodagar */}
      <div className="grid grid-cols-7 mb-1">
        {VECKODAGAR.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-[var(--muted)] py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Dagar */}
      <div className="grid grid-cols-7 gap-1">
        {dagar.map((dag) => {
          const dagensPaminnelser = paminnelserPerDag(dag);
          const vald = valdDag && isSameDay(dag, valdDag);
          return (
            <button
              key={dag.toISOString()}
              type="button"
              onClick={() => setValdDag(vald ? null : dag)}
              className={`relative flex min-h-11 flex-col items-center justify-start rounded-lg pt-1 pb-2 text-sm transition-colors ${
                vald
                  ? "bg-amber-500 text-white"
                  : isToday(dag)
                    ? "ring-2 ring-amber-500 text-[var(--foreground)] hover:bg-[var(--accent)]/10"
                    : isSameMonth(dag, manad)
                      ? "text-[var(--foreground)] hover:bg-[var(--accent)]/10"
                      : "text-[var(--muted)]/50 hover:bg-[var(--accent)]/10"
              }`}
            >
              {format(dag, "d")}
              {dagensPaminnelser.length > 0 && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {dagensPaminnelser.slice(0, 3).map((r) => (
                    <span
                      key={r.id}
                      className={`h-1.5 w-1.5 rounded-full ${
                        vald
                          ? "bg-white"
                          : categoryColors[r.kategori] || "bg-stone-500"
                      }`}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Vald dags påminnelser */}
      {valdDag && (
        <div className="mt-4 border-t border-[var(--card-border)] pt-3">
          <p className="text-sm font-medium text-[var(--foreground)] mb-2 capitalize">
            {format(valdDag, "EEEE d MMMM", { locale: sv })}
          </p>
          {valda.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Inga påminnelser denna dag.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {valda.map((r) => (
                <li key={r.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${categoryColors[r.kategori] || "bg-stone-500"}`}
                  />
                  <span className="text-[var(--foreground)]">{r.titel}</span>
                  <span className="text-[var(--muted)]">· {r.kategori}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
