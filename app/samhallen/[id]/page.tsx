import {
  ArrowLeft,
  Edit,
  Hexagon,
  Calendar,
  Crown,
  Box,
  GitBranch,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import DeleteColonyButton from "./DeleteColonyButton";
import AddEventButton from "./AddEventButton";

export const dynamic = "force-dynamic";
import EventTimeline from "./EventTimeline";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getColony(id: string, userId: string) {
  return prisma.colony.findFirst({
    where: { id, userId },
    include: {
      bigard: true,
      events: {
        orderBy: { datum: "desc" },
      },
      skapadFran: {
        select: { id: true, namn: true, bigard: { select: { namn: true } } },
      },
      avlaggare: {
        select: { id: true, namn: true, status: true, skapadDatum: true, bigard: { select: { namn: true } } },
        orderBy: { skapadDatum: "desc" },
      },
    },
  });
}

async function getApiaries(userId: string) {
  return prisma.apiary.findMany({
    where: { userId },
    select: { id: true, namn: true },
    orderBy: { namn: "asc" },
  });
}

export default async function SamhällePage({ params }: PageProps) {
  const userId = await requireAuth();
  const { id } = await params;
  const [colony, apiaries] = await Promise.all([
    getColony(id, userId),
    getApiaries(userId),
  ]);

  if (!colony) {
    notFound();
  }

  const statusColors: Record<string, string> = {
    Aktiv: "bg-emerald-100 text-emerald-700",
    Förlorat: "bg-red-100 text-red-700",
    Avyttrat: "bg-blue-100 text-blue-700",
    Sammanslagen: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/samhallen"
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--card-bg)] ring-1 ring-[var(--card-border)] text-[var(--accent-hover)] hover:bg-[var(--accent)]/10 transition-colors mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-[var(--foreground)]">
                {colony.namn}
              </h1>
              <span
                className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[colony.status] || "bg-[var(--accent)]/10 text-[var(--muted)]"}`}
              >
                {colony.status}
              </span>
            </div>
            <Link
              href={`/bigardar/${colony.bigard.id}`}
              className="text-[var(--accent-hover)] hover:text-[var(--accent)] mt-1 inline-block"
            >
              {colony.bigard.namn}
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/samhallen/${colony.id}/redigera`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--card-bg)] px-4 py-2 text-[var(--muted)] font-medium ring-1 ring-[var(--card-border)] hover:bg-[var(--accent)]/10 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Redigera
          </Link>
          <DeleteColonyButton
            colonyId={colony.id}
            colonyName={colony.namn}
            eventCount={colony.events.length}
          />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queen Info */}
        <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-[var(--accent-hover)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Drottning</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--accent-hover)]">Ras</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {colony.drottningRas || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--accent-hover)]">Märkningsår</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {colony.drottningAr || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--accent-hover)]">Vingklippt</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {colony.drottningVingklippt ? "Ja" : "Nej"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Hive Info */}
        <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-4">
            <Box className="h-5 w-5 text-[var(--accent-hover)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Kupa</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--accent-hover)]">Kuptyp</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {colony.kupaTyp || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--accent-hover)]">Ramar yngelrum</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {colony.ramTypYngelrum || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--accent-hover)]">Ramar skatt</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {colony.ramTypSkattlador || "-"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Meta Info */}
        <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-[var(--accent-hover)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Info</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--accent-hover)]">Platsnummer</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {colony.platsNummer || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--accent-hover)]">Skapad</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {new Date(colony.skapadDatum).toLocaleDateString("sv-SE")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--accent-hover)]">Händelser</dt>
              <dd className="font-medium text-[var(--foreground)]">
                {colony.events.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Related colonies */}
      {(colony.skapadFran || colony.avlaggare.length > 0) && (
        <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Släktträd
            </h2>
          </div>
          <div className="space-y-4">
            {colony.skapadFran && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <p className="text-xs font-medium text-purple-600 mb-2">MODERSAMHÄLLE</p>
                <Link
                  href={`/samhallen/${colony.skapadFran.id}`}
                  className="flex items-center gap-2 group"
                >
                  <Hexagon className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-purple-900 group-hover:text-purple-700">
                      {colony.skapadFran.namn}
                    </p>
                    <p className="text-xs text-purple-600">
                      {colony.skapadFran.bigard.namn}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-purple-400 ml-auto" />
                </Link>
              </div>
            )}
            {colony.avlaggare.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--accent-hover)] mb-2">
                  AVLÄGGARE ({colony.avlaggare.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {colony.avlaggare.map((a) => (
                    <Link
                      key={a.id}
                      href={`/samhallen/${a.id}`}
                      className="flex items-center gap-2 p-3 rounded-lg bg-[var(--accent)]/10 border border-[var(--card-border)] hover:bg-[var(--accent)]/20 transition-colors group"
                    >
                      <Hexagon className="h-5 w-5 text-[var(--accent)]" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--foreground)] truncate">
                          {a.namn}
                        </p>
                        <p className="text-xs text-[var(--accent-hover)]">
                          {a.bigard.namn} • {new Date(a.skapadDatum).toLocaleDateString("sv-SE")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.status === "Aktiv"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-[var(--accent)]/10 text-[var(--muted)]"
                        }`}
                      >
                        {a.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {colony.anteckningar && (
        <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Anteckningar
          </h2>
          <p className="text-[var(--muted)] whitespace-pre-wrap">
            {colony.anteckningar}
          </p>
        </div>
      )}

      {/* Events Section */}
      <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Händelser</h2>
          <AddEventButton colonyId={colony.id} apiaries={apiaries} />
        </div>

        <EventTimeline events={colony.events} colonyId={colony.id} />
      </div>
    </div>
  );
}
