import { MapPin, Hexagon, Scale, Calendar } from "lucide-react";
import prisma from "@/lib/db";
import Link from "next/link";

async function getStats() {
  const [apiaryCount, colonyCount, activeColonyCount, events] =
    await Promise.all([
      prisma.apiary.count(),
      prisma.colony.count(),
      prisma.colony.count({ where: { status: "Aktiv" } }),
      prisma.event.findMany({
        where: { handelseTyp: "Skörd" },
        orderBy: { datum: "desc" },
        take: 100,
      }),
    ]);

  // Calculate total harvest this year
  const currentYear = new Date().getFullYear();
  let totalHarvest = 0;
  events.forEach((event) => {
    if (new Date(event.datum).getFullYear() === currentYear && event.data) {
      try {
        const data = JSON.parse(event.data);
        if (data.mangdKg) {
          totalHarvest += data.mangdKg;
        }
      } catch {
        // ignore parse errors
      }
    }
  });

  return { apiaryCount, colonyCount, activeColonyCount, totalHarvest };
}

async function getRecentEvents() {
  return prisma.event.findMany({
    orderBy: { datum: "desc" },
    take: 5,
    include: {
      samhalle: {
        include: {
          bigard: true,
        },
      },
    },
  });
}

export default async function Dashboard() {
  const stats = await getStats();
  const recentEvents = await getRecentEvents();

  const statCards = [
    {
      name: "Bigårdar",
      value: stats.apiaryCount,
      icon: MapPin,
      href: "/bigardar",
      color: "bg-emerald-500",
    },
    {
      name: "Samhällen",
      value: stats.colonyCount,
      icon: Hexagon,
      href: "/samhallen",
      color: "bg-amber-500",
    },
    {
      name: "Aktiva samhällen",
      value: stats.activeColonyCount,
      icon: Hexagon,
      href: "/samhallen?status=Aktiv",
      color: "bg-blue-500",
    },
    {
      name: "Skörd i år (kg)",
      value: stats.totalHarvest.toFixed(1),
      icon: Scale,
      href: "/samhallen",
      color: "bg-yellow-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Krattorps bigårdar</h1>
        <p className="text-[var(--muted)] mt-1">
          Välkommen till BiManager - din biodlingsassistent
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="relative overflow-hidden rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)] hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.color}`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--muted)]">
                  {stat.name}
                </p>
                <p className="text-2xl font-bold text-[var(--foreground)]">
                  {stat.value}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Events */}
      <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Senaste händelser
          </h2>
        </div>
        {recentEvents.length === 0 ? (
          <p className="text-[var(--muted)] text-center py-8">
            Inga händelser registrerade ännu.{" "}
            <Link href="/samhallen" className="text-[var(--accent)] underline">
              Lägg till ett samhälle
            </Link>{" "}
            för att komma igång.
          </p>
        ) : (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between border-b border-[var(--card-border)] pb-3 last:border-0"
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
              </div>
            ))}
          </div>
        )}
      </div>

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
