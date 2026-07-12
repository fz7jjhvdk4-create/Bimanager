import { ArrowLeft, Edit, Trash2, Hexagon, Plus, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import DeleteApiaryButton from "./DeleteApiaryButton";

export const dynamic = "force-dynamic";
import ApiaryMapView from "./ApiaryMapView";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getApiary(id: string, userId: string) {
  return prisma.apiary.findFirst({
    where: { id, userId },
    include: {
      colonies: {
        orderBy: [{ status: "asc" }, { platsNummer: "asc" }],
      },
    },
  });
}

export default async function BigårdPage({ params }: PageProps) {
  const userId = await requireAuth();
  const { id } = await params;
  const apiary = await getApiary(id, userId);

  if (!apiary) {
    notFound();
  }

  const activeColonies = apiary.colonies.filter((c) => c.status === "Aktiv");
  const inactiveColonies = apiary.colonies.filter((c) => c.status !== "Aktiv");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/bigardar"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--card-bg)] ring-1 ring-[var(--card-border)] text-[var(--accent-hover)] hover:bg-[var(--accent)]/10 transition-colors mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">{apiary.namn}</h1>
            {apiary.adress && (
              <p className="text-[var(--accent-hover)] mt-1">{apiary.adress}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/bigardar/${apiary.id}/redigera`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--card-bg)] px-4 py-2 text-[var(--muted)] font-medium ring-1 ring-[var(--card-border)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Redigera
          </Link>
          <DeleteApiaryButton
            apiaryId={apiary.id}
            apiaryName={apiary.namn}
            hasColonies={apiary.colonies.length > 0}
          />
        </div>
      </div>

      {/* Map and Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="rounded-xl bg-[var(--card-bg)] shadow-sm ring-1 ring-[var(--card-border)] overflow-hidden">
          <div className="h-[300px]">
            <ApiaryMapView
              latitude={apiary.latitude}
              longitude={apiary.longitude}
            />
          </div>
        </div>

        {/* Info */}
        <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            Information
          </h2>
          <dl className="space-y-3">
            {apiary.latitude && apiary.longitude && (
              <div>
                <dt className="text-sm text-[var(--accent-hover)]">Koordinater</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {apiary.latitude.toFixed(6)}, {apiary.longitude.toFixed(6)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-[var(--accent-hover)]">Antal samhällen</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {activeColonies.length} aktiva av {apiary.colonies.length} totalt
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--accent-hover)]">Skapad</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {new Date(apiary.skapadDatum).toLocaleDateString("sv-SE")}
              </dd>
            </div>
            {apiary.beskrivning && (
              <div>
                <dt className="text-sm text-[var(--accent-hover)]">Beskrivning</dt>
                <dd className="font-medium text-[var(--foreground)]">
                  {apiary.beskrivning}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Colonies Section */}
      <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Samhällen</h2>
          <Link
            href={`/samhallen/ny?bigard=${apiary.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-sm text-white font-medium hover:bg-amber-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nytt samhälle
          </Link>
        </div>

        {apiary.colonies.length === 0 ? (
          <div className="text-center py-8">
            <Hexagon className="h-12 w-12 text-[var(--accent)]/40 mx-auto mb-3" />
            <p className="text-[var(--accent-hover)]">Inga samhällen i denna bigård ännu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Active colonies */}
            {activeColonies.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[var(--muted)] mb-2">
                  Aktiva ({activeColonies.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeColonies.map((colony) => (
                    <Link
                      key={colony.id}
                      href={`/samhallen/${colony.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-500 text-white text-sm font-medium">
                        {colony.platsNummer || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--foreground)] truncate">
                          {colony.namn}
                        </p>
                        <p className="text-xs text-[var(--accent-hover)]">
                          {colony.drottningRas || "Okänd ras"}
                          {colony.drottningAr && ` (${colony.drottningAr})`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive colonies */}
            {inactiveColonies.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[var(--accent)] mb-2">
                  Inaktiva ({inactiveColonies.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {inactiveColonies.map((colony) => (
                    <Link
                      key={colony.id}
                      href={`/samhallen/${colony.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--background)] hover:bg-[var(--accent)]/10 transition-colors opacity-70"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-stone-400 text-white text-sm font-medium">
                        {colony.platsNummer || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-[var(--muted)] truncate">
                          {colony.namn}
                        </p>
                        <p className="text-xs text-[var(--muted)]">{colony.status}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
