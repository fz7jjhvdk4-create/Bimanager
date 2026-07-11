import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ColonyForm from "@/components/forms/ColonyForm";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ bigard?: string }>;
}

async function getApiaries(userId: string) {
  return prisma.apiary.findMany({
    where: { userId },
    select: { id: true, namn: true },
    orderBy: { namn: "asc" },
  });
}

export default async function NyttSamhällePage({ searchParams }: PageProps) {
  const userId = await requireAuth();
  const params = await searchParams;
  const apiaries = await getApiaries(userId);

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
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--card-bg)] ring-1 ring-[var(--card-border)] text-[var(--accent)] hover:bg-[var(--input-bg)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Nytt samhälle</h1>
          <p className="text-[var(--muted)]">Lägg till ett nytt bisamhälle</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
        <ColonyForm apiaries={apiaries} defaultApiaryId={params.bigard} />
      </div>
    </div>
  );
}
