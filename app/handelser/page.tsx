"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, FileText } from "lucide-react";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import {
  eventColors,
  eventIcons,
  eventSummary,
} from "@/components/events/eventStyle";
import { EVENT_TYPES, type EventType } from "@/types";

interface Apiary {
  id: string;
  namn: string;
}

interface EventRad {
  id: string;
  handelseTyp: string;
  datum: string;
  beskrivning: string | null;
  data: string | null;
  samhalle: {
    id: string;
    namn: string;
    bigard: { id: string; namn: string };
  };
}

export default function HandelserPage() {
  const [events, setEvents] = useState<EventRad[]>([]);
  const [apiaries, setApiaries] = useState<Apiary[]>([]);
  const [loading, setLoading] = useState(true);

  const [typ, setTyp] = useState("");
  const [bigardId, setBigardId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    fetch("/api/apiaries")
      .then((res) => (res.ok ? res.json() : []))
      .then(setApiaries)
      .catch(() => setApiaries([]));
  }, []);

  useEffect(() => {
    let avbruten = false;
    setLoading(true);
    const params = new URLSearchParams();
    if (typ) params.set("handelseTyp", typ);
    if (bigardId) params.set("bigardId", bigardId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("limit", "200");

    fetch(`/api/events?${params}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!avbruten) setEvents(data);
      })
      .catch(() => {
        if (!avbruten) setEvents([]);
      })
      .finally(() => {
        if (!avbruten) setLoading(false);
      });
    return () => {
      avbruten = true;
    };
  }, [typ, bigardId, from, to]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <History className="h-8 w-8 text-[var(--accent-hover)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            Händelser
          </h1>
          <p className="text-[var(--muted)]">
            Alla händelser över samtliga bigårdar
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="rounded-xl bg-[var(--card-bg)] p-4 shadow-sm ring-1 ring-[var(--card-border)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label="Händelsetyp"
            value={typ}
            onChange={(e) => setTyp(e.target.value)}
            options={[
              { value: "", label: "Alla typer" },
              ...EVENT_TYPES.map((t) => ({ value: t, label: t })),
            ]}
          />
          <Select
            label="Bigård"
            value={bigardId}
            onChange={(e) => setBigardId(e.target.value)}
            options={[
              { value: "", label: "Alla bigårdar" },
              ...apiaries.map((a) => ({ value: a.id, label: a.namn })),
            ]}
          />
          <Input
            label="Från"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <Input
            label="Till"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-center py-12 text-[var(--muted)]">Laddar...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-[var(--accent)]/40 mx-auto mb-3" />
          <p className="text-[var(--muted)]">
            Inga händelser matchar filtren.
          </p>
        </div>
      ) : (
        <div className="rounded-xl bg-[var(--card-bg)] shadow-sm ring-1 ring-[var(--card-border)] divide-y divide-[var(--card-border)]">
          {events.map((event) => {
            const Icon = eventIcons[event.handelseTyp as EventType] || FileText;
            const color =
              eventColors[event.handelseTyp as EventType] || "bg-stone-500";
            let data: Record<string, unknown> = {};
            try {
              if (event.data) data = JSON.parse(event.data);
            } catch {
              // ogiltig JSON — visa raden utan sammanfattning
            }
            const sammanfattning = eventSummary(event.handelseTyp, data);

            return (
              <Link
                key={event.id}
                href={`/samhallen/${event.samhalle.id}`}
                className="flex items-center gap-3 p-4 hover:bg-[var(--accent)]/10 transition-colors"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--foreground)]">
                    {event.handelseTyp}
                    <span className="font-normal text-[var(--muted)]">
                      {" "}
                      · {event.samhalle.namn} ({event.samhalle.bigard.namn})
                    </span>
                  </p>
                  {(sammanfattning || event.beskrivning) && (
                    <p className="text-sm text-[var(--muted)] truncate">
                      {sammanfattning || event.beskrivning}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-sm text-[var(--muted)]">
                  {new Date(event.datum).toLocaleDateString("sv-SE")}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
