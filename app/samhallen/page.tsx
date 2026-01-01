import { Hexagon, Plus, MapPin, Filter } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";
import ColonyFilters from "./ColonyFilters";

interface PageProps {
  searchParams: Promise<{ status?: string; bigard?: string }>;
}

async function getColonies(status?: string, bigardId?: string) {
  const where: Record<string, unknown> = {};
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

async function getApiaries() {
  return prisma.apiary.findMany({
    select: { id: true, namn: true },
    orderBy: { namn: "asc" },
  });
}

export default async function SamhällenPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const [colonies, apiaries] = await Promise.all([
    getColonies(params.status, params.bigard),
    getApiaries(),
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
          <h1 className="text-3xl font-bold text-amber-900">Samhällen</h1>
          <p className="text-amber-700 mt-1">
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
        <div className="rounded-xl bg-white p-12 shadow-sm ring-1 ring-amber-100 text-center">
          <Hexagon className="h-12 w-12 text-amber-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-amber-900 mb-2">
            Inga samhällen hittades
          </h3>
          <p className="text-amber-600 mb-4">
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
              className="rounded-xl bg-white shadow-sm ring-1 ring-amber-100 overflow-hidden"
            >
              {/* Apiary Header */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-3 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <Link
                    href={`/bigardar/${group.apiary.id}`}
                    className="font-medium text-amber-900 hover:text-amber-700"
                  >
                    {group.apiary.namn}
                  </Link>
                  <span className="text-sm text-amber-600">
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
                    className="flex items-start gap-3 p-4 rounded-lg bg-stone-50 hover:bg-amber-50 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white font-semibold">
                      {colony.platsNummer || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-amber-900 group-hover:text-amber-700 truncate">
                          {colony.namn}
                        </p>
                        <span
                          className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${statusColors[colony.status] || "bg-stone-100 text-stone-600"}`}
                        >
                          {colony.status}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-amber-600">
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
                          <span className="text-amber-400">
                            Ingen info angiven
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-amber-500">
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
