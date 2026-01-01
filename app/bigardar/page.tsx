import { MapPin, Plus, Hexagon } from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/db";

async function getApiaries() {
  return prisma.apiary.findMany({
    include: {
      _count: {
        select: { colonies: true },
      },
      colonies: {
        where: { status: "Aktiv" },
        select: { id: true },
      },
    },
    orderBy: { namn: "asc" },
  });
}

export default async function BigårdarPage() {
  const apiaries = await getApiaries();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-900">Bigårdar</h1>
          <p className="text-amber-700 mt-1">
            Hantera dina bigårdar och deras samhällen
          </p>
        </div>
        <Link
          href="/bigardar/ny"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white font-medium hover:bg-amber-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Ny bigård
        </Link>
      </div>

      {/* Apiaries Grid */}
      {apiaries.length === 0 ? (
        <div className="rounded-xl bg-white p-12 shadow-sm ring-1 ring-amber-100 text-center">
          <MapPin className="h-12 w-12 text-amber-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-amber-900 mb-2">
            Inga bigårdar ännu
          </h3>
          <p className="text-amber-600 mb-4">
            Börja med att lägga till din första bigård.
          </p>
          <Link
            href="/bigardar/ny"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-white font-medium hover:bg-amber-600 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Lägg till bigård
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apiaries.map((apiary) => (
            <Link
              key={apiary.id}
              href={`/bigardar/${apiary.id}`}
              className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100 hover:shadow-md hover:ring-amber-200 transition-all"
            >
              {/* Map preview placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100 opacity-50" />

              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900 group-hover:text-amber-700 transition-colors">
                        {apiary.namn}
                      </h3>
                      {apiary.adress && (
                        <p className="text-sm text-amber-600 truncate max-w-[200px]">
                          {apiary.adress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-amber-700">
                    <Hexagon className="h-4 w-4" />
                    <span>
                      {apiary.colonies.length} aktiva /{" "}
                      {apiary._count.colonies} totalt
                    </span>
                  </div>
                </div>

                {apiary.beskrivning && (
                  <p className="mt-3 text-sm text-amber-600 line-clamp-2">
                    {apiary.beskrivning}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
