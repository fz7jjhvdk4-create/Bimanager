"use client";

/**
 * Enkel offline-kö för händelser som inte kunde sparas p.g.a. nätverksfel
 * (bigårdar saknar ofta täckning). Kön ligger i localStorage och synkas
 * när appen är online igen — se OfflineSyncBanner.
 */

const NYCKEL = "bimanager-offline-events";

export interface HandelsePayload {
  samhalleId: string;
  handelseTyp: string;
  datum: string;
  beskrivning?: string | null;
  data?: Record<string, unknown> | null;
}

export interface KoadHandelse {
  id: string;
  payload: HandelsePayload;
  samhalleNamn?: string;
  skapad: string;
}

export function lasKo(): KoadHandelse[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(NYCKEL) ?? "[]");
  } catch {
    return [];
  }
}

function skrivKo(ko: KoadHandelse[]) {
  window.localStorage.setItem(NYCKEL, JSON.stringify(ko));
  // Meddela lyssnare (t.ex. OfflineSyncBanner) i samma flik
  window.dispatchEvent(new Event("bimanager-offline-ko"));
}

export function laggIKo(payload: HandelsePayload, samhalleNamn?: string) {
  const ko = lasKo();
  ko.push({
    id: crypto.randomUUID(),
    payload,
    samhalleNamn,
    skapad: new Date().toISOString(),
  });
  skrivKo(ko);
}

/** Nätverksfel (fetch kastar TypeError) — till skillnad från serverfel. */
export function arNatverksfel(fel: unknown): boolean {
  return fel instanceof TypeError;
}

/**
 * Försöker skicka alla köade händelser. Slutar vid första nätverksfelet
 * (fortfarande offline); serverfel (4xx/5xx) kastar köposten så att den
 * inte fastnar för evigt — felet loggas.
 */
export async function synkaKo(): Promise<{ synkade: number; kvar: number }> {
  let ko = lasKo();
  let synkade = 0;

  for (const post of [...ko]) {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(post.payload),
      });
      if (res.ok) {
        synkade++;
      } else {
        console.error(
          "Köad händelse avvisades av servern och togs bort ur kön:",
          post,
          await res.json().catch(() => null)
        );
      }
      ko = ko.filter((p) => p.id !== post.id);
      skrivKo(ko);
    } catch {
      // fortfarande offline — behåll resten av kön
      break;
    }
  }

  return { synkade, kvar: ko.length };
}
