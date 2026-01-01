import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import ApiaryForm from "@/components/forms/ApiaryForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getApiary(id: string) {
  return prisma.apiary.findUnique({
    where: { id },
  });
}

export default async function RedigeraBigårdPage({ params }: PageProps) {
  const { id } = await params;
  const apiary = await getApiary(id);

  if (!apiary) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/bigardar/${apiary.id}`}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white ring-1 ring-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Redigera bigård</h1>
          <p className="text-amber-600">{apiary.namn}</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
        <ApiaryForm apiary={apiary} />
      </div>
    </div>
  );
}
