import { MapPin, Hexagon, Scale, Calendar } from "lucide-react";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import OnboardingChecklist from "./OnboardingChecklist";
import AttGoraKort from "./AttGoraKort";
import StatistikSektion from "./StatistikSektion";

export const dynamic = "force-dynamic";

async function getOverview(userId: string) {
  const [apiaryCount, colonyCount, eventCount, recentEvents, user] =
    await Promise.all([
      prisma.apiary.count({ where: { userId } }),
      prisma.colony.count({ where: { userId } }),
      prisma.event.count({ where: { userId } }),
      prisma.event.findMany({
        where: { userId },
        orderBy: { datum: "desc" },
        take: 5,
        include: {
          samhalle: {
            include: {
              bigard: true,
            },
          },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      }),
    ]);

  return {
    apiaryCount,
    colonyCount,
    eventCount,
    recentEvents,
    userName: user?.name ?? null,
  };
}

export default async function Oversikt() {
  const userId = await requireAuth();
  const { apiaryCount, colonyCount, eventCount, recentEvents, userName } =
    await getOverview(userId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">
          {userName ? `Hej ${userName.split(" ")[0]}!` : "Översikt"}
        </h1>
        <p className="text-[var(--muted)] mt-1">
          Läget just nu och statistik för din biodling
        </p>
      </div>

      {/* Kom igång-guide för nya konton */}
      <OnboardingChecklist
        apiaryCount={apiaryCount}
        colonyCount={colonyCount}
        eventCount={eventCount}
      />

      {/* Läget nu: att göra + senaste händelser */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttGoraKort userId={userId} />

        <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Senaste händelser
              </h2>
            </div>
            <Link
              href="/handelser"
              className="text-sm text-[var(--accent-hover)] hover:text-[var(--accent)]"
            >
              Visa alla
            </Link>
          </div>
          {recentEvents.length === 0 ? (
            <p className="text-[var(--muted)] text-center py-8">
              Inga händelser registrerade ännu.{" "}
              <Link
                href="/samhallen"
                className="text-[var(--accent)] underline"
              >
                Lägg till ett samhälle
              </Link>{" "}
              för att komma igång.
            </p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/samhallen/${event.samhalle.id}`}
                  className="flex items-center justify-between border-b border-[var(--card-border)] pb-3 last:border-0 hover:bg-[var(--accent)]/5 -mx-2 px-2 rounded transition-colors"
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {event.handelseTyp}
                    </p>
                    <p className="text-sm text-[var(--muted)]">
                      {event.samhalle.namn} - {event.samhalle.bigard.namn}
                    </p>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    {new Date(event.datum).toLocaleDateString("sv-SE")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistik: KPI-rad, årväljare och flikar */}
      <StatistikSektion />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/bigardar/ny"
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          <MapPin className="h-6 w-6" />
          <span className="font-medium">Lägg till bigård</span>
        </Link>
        <Link
          href="/samhallen/ny"
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 p-4 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          <Hexagon className="h-6 w-6" />
          <span className="font-medium">Lägg till samhälle</span>
        </Link>
        <Link
          href="/kassabok"
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-700 to-amber-800 p-4 text-white shadow-md hover:shadow-lg transition-shadow"
        >
          <Scale className="h-6 w-6" />
          <span className="font-medium">Kassabok</span>
        </Link>
      </div>
    </div>
  );
}
