"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudOff, RefreshCw } from "lucide-react";
import { lasKo, synkaKo } from "@/lib/offlineQueue";

/**
 * Visas när det finns händelser i offline-kön. Synkar automatiskt när
 * webbläsaren blir online igen och vid sidladdning.
 */
export default function OfflineSyncBanner() {
  const router = useRouter();
  const [antal, setAntal] = useState(0);
  const [synkar, setSynkar] = useState(false);

  const uppdateraAntal = useCallback(() => {
    setAntal(lasKo().length);
  }, []);

  const synka = useCallback(async () => {
    if (lasKo().length === 0) return;
    setSynkar(true);
    try {
      const { synkade } = await synkaKo();
      if (synkade > 0) router.refresh();
    } finally {
      setSynkar(false);
      uppdateraAntal();
    }
  }, [router, uppdateraAntal]);

  useEffect(() => {
    uppdateraAntal();
    // Synka direkt om det ligger något kvar sedan förra besöket
    synka();

    window.addEventListener("online", synka);
    window.addEventListener("bimanager-offline-ko", uppdateraAntal);
    return () => {
      window.removeEventListener("online", synka);
      window.removeEventListener("bimanager-offline-ko", uppdateraAntal);
    };
  }, [synka, uppdateraAntal]);

  if (antal === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-xl bg-stone-900 px-4 py-3 text-white shadow-lg dark:bg-stone-100 dark:text-stone-900">
      <CloudOff className="h-5 w-5 shrink-0" />
      <span className="text-sm">
        {antal === 1
          ? "1 händelse väntar på synkning"
          : `${antal} händelser väntar på synkning`}
      </span>
      <button
        onClick={synka}
        disabled={synkar}
        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${synkar ? "animate-spin" : ""}`} />
        Synka nu
      </button>
    </div>
  );
}
