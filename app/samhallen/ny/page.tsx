import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import ColonyForm from "@/components/forms/ColonyForm";

interface PageProps {
  searchParams: Promise<{ bigard?: string }>;
}

async function getApiaries() {
  return prisma.apiary.findMany({
    select: { id: true, namn: true },
    orderBy: { namn: "asc" },
  });
}

export default async function NyttSamhällePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const apiaries = await getApiaries();

  // If no apiaries exist, redirect to create one first
  if (apiaries.length === 0) {
    redirect("/bigardar/ny?from=samhalle");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/samhallen"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white ring-1 ring-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Nytt samhälle</h1>
          <p className="text-amber-600">Lägg till ett nytt bisamhälle</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
        <ColonyForm apiaries={apiaries} defaultApiaryId={params.bigard} />
      </div>
    </div>
  );
}
