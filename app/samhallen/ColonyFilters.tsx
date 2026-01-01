"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X } from "lucide-react";
import { COLONY_STATUSES } from "@/types";

interface ColonyFiltersProps {
  apiaries: Array<{ id: string; namn: string }>;
  currentStatus?: string;
  currentApiary?: string;
}

export default function ColonyFilters({
  apiaries,
  currentStatus,
  currentApiary,
}: ColonyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/samhallen?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/samhallen");
  };

  const hasFilters = currentStatus || currentApiary;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-amber-600">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filter:</span>
      </div>

      {/* Status filter */}
      <select
        value={currentStatus || ""}
        onChange={(e) => updateFilter("status", e.target.value || null)}
        className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="">Alla statusar</option>
        {COLONY_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      {/* Apiary filter */}
      <select
        value={currentApiary || ""}
        onChange={(e) => updateFilter("bigard", e.target.value || null)}
        className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="">Alla bigårdar</option>
        {apiaries.map((apiary) => (
          <option key={apiary.id} value={apiary.id}>
            {apiary.namn}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={clearFilters}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-200 transition-colors"
        >
          <X className="h-3 w-3" />
          Rensa filter
        </button>
      )}
    </div>
  );
}
