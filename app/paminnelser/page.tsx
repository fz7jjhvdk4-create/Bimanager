import { Bell, Plus, Check, AlertTriangle, Calendar, Hexagon, MapPin } from "lucide-react";
import prisma from "@/lib/db";
import Link from "next/link";
import AddReminderButton from "./AddReminderButton";
import ReminderCard from "./ReminderCard";

async function getReminders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.reminder.findMany({
    where: {
      utford: false,
    },
    include: {
      samhalle: {
        select: {
          id: true,
          namn: true,
          bigard: { select: { id: true, namn: true } },
        },
      },
      bigard: {
        select: { id: true, namn: true },
      },
    },
    orderBy: { datum: "asc" },
  });
}

async function getCompletedReminders() {
  return prisma.reminder.findMany({
    where: {
      utford: true,
    },
    include: {
      samhalle: {
        select: {
          id: true,
          namn: true,
          bigard: { select: { id: true, namn: true } },
        },
      },
      bigard: {
        select: { id: true, namn: true },
      },
    },
    orderBy: { utfordDatum: "desc" },
    take: 10,
  });
}

async function getApiariesAndColonies() {
  const [apiaries, colonies] = await Promise.all([
    prisma.apiary.findMany({
      select: { id: true, namn: true },
      orderBy: { namn: "asc" },
    }),
    prisma.colony.findMany({
      where: { status: "Aktiv" },
      select: {
        id: true,
        namn: true,
        bigard: { select: { id: true, namn: true } },
      },
      orderBy: { namn: "asc" },
    }),
  ]);
  return { apiaries, colonies };
}

export default async function PaminnelserPage() {
  const [reminders, completedReminders, { apiaries, colonies }] = await Promise.all([
    getReminders(),
    getCompletedReminders(),
    getApiariesAndColonies(),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group reminders by urgency
  const overdueReminders = reminders.filter(r => new Date(r.datum) < today);
  const todayReminders = reminders.filter(r => {
    const d = new Date(r.datum);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
  const upcomingReminders = reminders.filter(r => new Date(r.datum) > today);

  const categoryColors: Record<string, string> = {
    Varroabehandling: "bg-rose-500",
    Inspektion: "bg-blue-500",
    Invintring: "bg-cyan-500",
    Utfodring: "bg-amber-500",
    Skörd: "bg-yellow-500",
    Övrigt: "bg-stone-500",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Påminnelser</h1>
          <p className="text-[var(--muted)] mt-1">
            Håll koll på viktiga uppgifter i din biodling
          </p>
        </div>
        <AddReminderButton apiaries={apiaries} colonies={colonies} />
      </div>

      {/* Alert for overdue */}
      {overdueReminders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">
              {overdueReminders.length} försenad{overdueReminders.length > 1 ? "e" : ""} påminnelse{overdueReminders.length > 1 ? "r" : ""}
            </p>
            <p className="text-sm text-red-600">
              Du har påminnelser som passerat sitt datum
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--card-bg)] rounded-xl p-4 ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{overdueReminders.length}</p>
              <p className="text-sm text-[var(--muted)]">Försenade</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{todayReminders.length}</p>
              <p className="text-sm text-[var(--muted)]">Idag</p>
            </div>
          </div>
        </div>
        <div className="bg-[var(--card-bg)] rounded-xl p-4 ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{upcomingReminders.length}</p>
              <p className="text-sm text-[var(--muted)]">Kommande</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue reminders */}
      {overdueReminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Försenade
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {overdueReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                categoryColor={categoryColors[reminder.kategori] || "bg-stone-500"}
                isOverdue
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's reminders */}
      {todayReminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-amber-600 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Idag
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {todayReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                categoryColor={categoryColors[reminder.kategori] || "bg-stone-500"}
                isToday
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming reminders */}
      {upcomingReminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[var(--accent)]" />
            Kommande
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                categoryColor={categoryColors[reminder.kategori] || "bg-stone-500"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {reminders.length === 0 && (
        <div className="text-center py-12 bg-[var(--card-bg)] rounded-xl ring-1 ring-[var(--card-border)]">
          <Bell className="h-12 w-12 mx-auto text-[var(--muted)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)]">Inga påminnelser</h3>
          <p className="text-[var(--muted)] mt-1">
            Skapa en påminnelse för att hålla koll på viktiga uppgifter
          </p>
        </div>
      )}

      {/* Completed reminders */}
      {completedReminders.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--muted)] flex items-center gap-2">
            <Check className="h-5 w-5" />
            Nyligen utförda
          </h2>
          <div className="bg-[var(--card-bg)] rounded-xl ring-1 ring-[var(--card-border)] divide-y divide-[var(--card-border)]">
            {completedReminders.map((reminder) => (
              <div key={reminder.id} className="p-4 flex items-center justify-between opacity-60">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${categoryColors[reminder.kategori] || "bg-stone-500"}`} />
                  <div>
                    <p className="font-medium text-[var(--foreground)] line-through">{reminder.titel}</p>
                    <p className="text-sm text-[var(--muted)]">
                      Utförd {reminder.utfordDatum ? new Date(reminder.utfordDatum).toLocaleDateString("sv-SE") : ""}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
