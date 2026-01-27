import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ApiaryForm from "@/components/forms/ApiaryForm";

export default function NyBigårdPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/bigardar"
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--card-bg)] ring-1 ring-[var(--card-border)] text-[var(--accent)] hover:bg-[var(--input-bg)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Ny bigård</h1>
          <p className="text-[var(--muted)]">Lägg till en ny bigård</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-[var(--card-bg)] p-6 shadow-sm ring-1 ring-[var(--card-border)]">
        <ApiaryForm />
      </div>
    </div>
  );
}
