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
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white ring-1 ring-amber-200 text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Ny bigård</h1>
          <p className="text-amber-600">Lägg till en ny bigård</p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-amber-100">
        <ApiaryForm />
      </div>
    </div>
  );
}
