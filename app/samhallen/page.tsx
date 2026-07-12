import { Hexagon, Plus, MapPin, Filter } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ColonyFilters from "./ColonyFilters";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ status?: string; bigard?: string }>;
}

async function getColonies(userId: string, status?: string, bigardId?: string) {
  const where: Record<string, unknown> = { userId };
  if (status) where.status = status;
  if (bigardId) where.bigardId = bigardId;

  return prisma.colony.findMany({
    where,
    include: {
      bigard: {
        select: {
          id: true,
          namn: true,
        },
      },
      _count: {
        select: { events: true },
      },
    },
    orderBy: [{ bigard: { namn: "asc" } }, { platsNummer: "asc" }],
  });
}

async function getApiaries(userId: string) {
  return prisma.apiary.findMany({
    where: { userId },
    select: { id: true, namn: true },
    orderBy: { namn: "asc" },
  });
}

export default async function SamhällenPage({ searchParams }: PageProps) {
  const userId = await requireAuth();
  const params = await searchParams;
  const [colonies, apiaries] = await Promise.all([
    getColonies(userId, params.status, params.bigard),
    getApiaries(userId),
  ]);

  // Group colonies by apiary
  const coloniesByApiary = colonies.reduce(
    (acc, colony) => {
      const apiaryId = colony.bigard.id;
      if (!acc[apiaryId]) {
        acc[apiaryId] = {
          apiary: colony.bigard,
          colonies: [],
        };
      }
      acc[apiaryId].colonies.push(colony);
      return acc;
    },
    {} as Record<
      string,
      {
        apiary: { id: string; namn: string };
        colonies: typeof colonies;
      }
    >
  );

  const statusColors: Record<string, string> = {
    Aktiv: "bg-emerald-100 text-emerald-700",
    Förlorat: "bg-red-100 text-red-700",
    Avyttrat: "bg-blue-100 text-blue-700",
    Sammanslagen: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Samhällen</h1>
          <p className="text-[var(--muted)] mt-1">
            Hantera dina bisamhällen och deras händelser
          </p>
        </div>
        <Link
          href="/samhallen/ny"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white font-medium hover:bg-amber-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nytt samhälle
        </Link>
      </div>

      {/* Filters */}
      <ColonyFilters apiaries={apiaries} currentStatus={params.status} currentApiary={params.bigard} />

      {/* Colonies */}
      {colonies.length === 0 ? (
        <div className="rounded-xl bg-[var(--card-bg)] p-12 shadow-sm ring-1 ring-[var(--card-border)] text-center">
          <Hexagon className="h-12 w-12 text-[var(--accent)]/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            Inga samhällen hittades
          </h3>
          <p className="text-[var(--accent-hover)] mb-4">
            {params.status || params.bigard
              ? "Inga samhällen matchar dina filter."
              : "Börja med att lägga till ditt första samhälle."}
          </p>
          <Link
            href="/samhallen/ny"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white font-medium hover:bg-amber-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Lägg till samhälle
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(coloniesByApiary).map(([apiaryId, group]) => (
            <div
              key={apiaryId}
              className="rounded-xl bg-[var(--card-bg)] shadow-sm ring-1 ring-[var(--card-border)] overflow-hidden"
            >
              {/* Apiary Header */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-3 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--accent-hover)]" />
                  <Link
                    href={`/bigardar/${group.apiary.id}`}
                    className="font-medium text-[var(--foreground)] hover:text-[var(--accent)]"
                  >
                    {group.apiary.namn}
                  </Link>
                  <span className="text-sm text-[var(--accent-hover)]">
                    ({group.colonies.length} samhällen)
                  </span>
                </div>
              </div>

              {/* Colonies Grid */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.colonies.map((colony) => (
                  <Link
                    key={colony.id}
                    href={`/samhallen/${colony.id}`}
                    className="flex items-start gap-3 p-4 rounded-lg bg-[var(--background)] hover:bg-[var(--accent)]/10 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-semibold">
                      {colony.platsNummer || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] truncate">
                          {colony.namn}
                        </p>
                        <span
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${statusColors[colony.status] || "bg-[var(--accent)]/10 text-[var(--muted)]"}`}
                        >
                          {colony.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-[var(--accent-hover)]">
                        {colony.drottningRas && (
                          <span>
                            {colony.drottningRas}
                            {colony.drottningAr && ` (${colony.drottningAr})`}
                          </span>
                        )}
                        {!colony.drottningRas && colony.kupaTyp && (
                          <span>{colony.kupaTyp}</span>
                        )}
                        {!colony.drottningRas && !colony.kupaTyp && (
                          <span className="text-[var(--accent)]">
                            Ingen info angiven
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[var(--accent)]">
                        {colony._count.events} händelser
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
