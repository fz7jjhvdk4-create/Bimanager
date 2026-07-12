"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";

/** Skapar tydligt namngiven exempeldata så nya användare kan utforska appen. */
export default function DemoDataButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo-data", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Kunde inte skapa exempeldata");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm text-[var(--accent-hover)] hover:text-[var(--accent)] transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="h-4 w-4" />
        )}
        Eller utforska med exempeldata (kan tas bort när som helst)
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
