import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ColonyForm from "@/components/forms/ColonyForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getColony(id: string, userId: string) {
  return prisma.colony.findFirst({
    where: { id, userId },
  });
}

async function getApiaries(userId: string) {
  return prisma.apiary.findMany({
    where: { userId },
    select: { id: true, namn: true },
    orderBy: { namn: "asc" },
  });
}

export default async function RedigeraSamhällePage({ params }: PageProps) {
  const userId = await requireAuth();
  const { id } = await params;
  const [colony, apiaries] = await Promise.all([
    getColony(id, userId),
    getApiaries(userId),
  ]);

  if (!colony) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/samhallen/${colony.id}`}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--card-bg)] ring-1 ring-[var(--card-border)] text-[var(--accent)] hover:bg-[var(--input-bg)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Redigera samhälle</h1>
          <p className="text-[var(--muted)]">{colony.namn}</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
        <ColonyForm apiaries={apiaries} colony={colony} />
      </div>
    </div>
  );
}
