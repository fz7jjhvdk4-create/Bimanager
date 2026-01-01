"use client";

import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Clock, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Reminder {
  id: string;
  titel: string;
  datum: string;
  kategori: string;
  samhalle?: { namn: string } | null;
  bigard?: { namn: string } | null;
}

export default function NotificationBell() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
    // Refresh every 5 minutes
    const interval = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchReminders() {
    try {
      const response = await fetch("/api/reminders?upcoming=true");
      if (response.ok) {
        const data = await response.json();
        setReminders(data.slice(0, 5)); // Show max 5 notifications
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markComplete(id: string) {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utford: true }),
      });

      if (response.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== id));
        router.refresh();
      }
    } catch (error) {
      console.error("Error completing reminder:", error);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueCount = reminders.filter((r) => new Date(r.datum) < today).length;
  const todayCount = reminders.filter((r) => {
    const d = new Date(r.datum);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;

  const totalUrgent = overdueCount + todayCount;

  const getDaysText = (dateStr: string) => {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return `${Math.abs(diff)} dagar sedan`;
    if (diff === 0) return "Idag";
    if (diff === 1) return "Imorgon";
    return `Om ${diff} dagar`;
  };

  const isOverdue = (dateStr: string) => new Date(dateStr) < today;
  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  if (loading) {
    return (
      <div className="relative p-2">
        <Bell className="h-6 w-6 text-[var(--muted)]" />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 rounded-lg hover:bg-[var(--accent)]/10 transition-colors"
      >
        <Bell
          className={`h-6 w-6 ${
            totalUrgent > 0 ? "text-amber-500" : "text-[var(--muted)]"
          }`}
        />
        {reminders.length > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white ${
              overdueCount > 0 ? "bg-red-500" : "bg-amber-500"
            }`}
          >
            {reminders.length}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--card-bg)] rounded-xl shadow-xl ring-1 ring-[var(--card-border)] z-50 overflow-hidden">
            <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--foreground)]">
                Påminnelser
              </h3>
              <button
                onClick={() => setShowPanel(false)}
                className="p-1 rounded hover:bg-[var(--accent)]/10"
              >
                <X className="h-4 w-4 text-[var(--muted)]" />
              </button>
            </div>

            {reminders.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 mx-auto text-[var(--muted)] mb-2" />
                <p className="text-sm text-[var(--muted)]">
                  Inga kommande påminnelser
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--card-border)] max-h-80 overflow-y-auto">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`p-3 hover:bg-[var(--accent)]/5 ${
                      isOverdue(reminder.datum) ? "bg-red-50/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-[var(--foreground)] truncate">
                          {reminder.titel}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs flex items-center gap-1 ${
                              isOverdue(reminder.datum)
                                ? "text-red-600"
                                : isToday(reminder.datum)
                                ? "text-amber-600"
                                : "text-[var(--muted)]"
                            }`}
                          >
                            {isOverdue(reminder.datum) ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {getDaysText(reminder.datum)}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            {reminder.kategori}
                          </span>
                        </div>
                        {(reminder.samhalle || reminder.bigard) && (
                          <p className="text-xs text-[var(--muted)] mt-1 truncate">
                            {reminder.samhalle?.namn || reminder.bigard?.namn}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => markComplete(reminder.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        title="Markera som utförd"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 border-t border-[var(--card-border)]">
              <Link
                href="/paminnelser"
                onClick={() => setShowPanel(false)}
                className="block w-full text-center text-sm font-medium text-[var(--accent)] hover:underline"
              >
                Visa alla påminnelser
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
