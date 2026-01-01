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
import DeleteColonyButton from "./DeleteColonyButton";
import AddEventButton from "./AddEventButton";
import EventTimeline from "./EventTimeline";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getColony(id: string) {
  return prisma.colony.findUnique({
    where: { id },
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

async function getApiaries() {
  return prisma.apiary.findMany({
    select: { id: true, namn: true },
    orderBy: { namn: "asc" },
  });
}

export default async function SamhällePage({ params }: PageProps) {
  const { id } = await params;
  const [colony, apiaries] = await Promise.all([
    getColony(id),
    getApiaries(),
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
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white ring-1 ring-amber-200 text-amber-600 hover:bg-amber-50 transition-colors mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-amber-900">
                {colony.namn}
              </h1>
              <span
                className={`px-2 py-1 rounded-full text-sm font-medium ${statusColors[colony.status] || "bg-stone-100 text-stone-600"}`}
              >
                {colony.status}
              </span>
            </div>
            <Link
              href={`/bigardar/${colony.bigard.id}`}
              className="text-amber-600 hover:text-amber-700 mt-1 inline-block"
            >
              {colony.bigard.namn}
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/samhallen/${colony.id}/redigera`}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-amber-700 font-medium ring-1 ring-amber-200 hover:bg-amber-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Redigera
          </Link>
          <DeleteColonyButton colonyId={colony.id} colonyName={colony.namn} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queen Info */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-900">Drottning</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-amber-600">Ras</dt>
              <dd className="font-medium text-amber-900">
                {colony.drottningRas || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-amber-600">Märkningsår</dt>
              <dd className="font-medium text-amber-900">
                {colony.drottningAr || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-amber-600">Vingklippt</dt>
              <dd className="font-medium text-amber-900">
                {colony.drottningVingklippt ? "Ja" : "Nej"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Hive Info */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <Box className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-900">Kupa</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-amber-600">Kuptyp</dt>
              <dd className="font-medium text-amber-900">
                {colony.kupaTyp || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-amber-600">Ramar yngelrum</dt>
              <dd className="font-medium text-amber-900">
                {colony.ramTypYngelrum || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-amber-600">Ramar skatt</dt>
              <dd className="font-medium text-amber-900">
                {colony.ramTypSkattlador || "-"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Meta Info */}
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-amber-900">Info</h2>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-amber-600">Platsnummer</dt>
              <dd className="font-medium text-amber-900">
                {colony.platsNummer || "-"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-amber-600">Skapad</dt>
              <dd className="font-medium text-amber-900">
                {new Date(colony.skapadDatum).toLocaleDateString("sv-SE")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-amber-600">Händelser</dt>
              <dd className="font-medium text-amber-900">
                {colony.events.length}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Related colonies */}
      {(colony.skapadFran || colony.avlaggare.length > 0) && (
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-amber-900">
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
                <p className="text-xs font-medium text-amber-600 mb-2">
                  AVLÄGGARE ({colony.avlaggare.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {colony.avlaggare.map((a) => (
                    <Link
                      key={a.id}
                      href={`/samhallen/${a.id}`}
                      className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group"
                    >
                      <Hexagon className="h-5 w-5 text-amber-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-amber-900 truncate">
                          {a.namn}
                        </p>
                        <p className="text-xs text-amber-600">
                          {a.bigard.namn} • {new Date(a.skapadDatum).toLocaleDateString("sv-SE")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.status === "Aktiv"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-stone-100 text-stone-600"
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
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
          <h2 className="text-lg font-semibold text-amber-900 mb-2">
            Anteckningar
          </h2>
          <p className="text-amber-700 whitespace-pre-wrap">
            {colony.anteckningar}
          </p>
        </div>
      )}

      {/* Events Section */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-amber-900">Händelser</h2>
          <AddEventButton colonyId={colony.id} apiaries={apiaries} />
        </div>

        <EventTimeline events={colony.events} colonyId={colony.id} />
      </div>
    </div>
  );
}
