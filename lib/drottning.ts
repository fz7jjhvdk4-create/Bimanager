/**
 * Internationell märkfärgskod för drottningar: färgen bestäms av
 * födelseårets sista siffra. 1/6 vit, 2/7 gul, 3/8 röd, 4/9 grön, 5/0 blå.
 */

export interface Markfarg {
  namn: string;
  /** Tailwind-klasser för en färgprick, med ring så att vit syns. */
  cssKlass: string;
}

const FARGER: Record<number, Markfarg> = {
  1: { namn: "Vit", cssKlass: "bg-white ring-1 ring-stone-300" },
  6: { namn: "Vit", cssKlass: "bg-white ring-1 ring-stone-300" },
  2: { namn: "Gul", cssKlass: "bg-yellow-400" },
  7: { namn: "Gul", cssKlass: "bg-yellow-400" },
  3: { namn: "Röd", cssKlass: "bg-red-500" },
  8: { namn: "Röd", cssKlass: "bg-red-500" },
  4: { namn: "Grön", cssKlass: "bg-green-600" },
  9: { namn: "Grön", cssKlass: "bg-green-600" },
  5: { namn: "Blå", cssKlass: "bg-blue-500" },
  0: { namn: "Blå", cssKlass: "bg-blue-500" },
};

export function markfarg(ar: number | null | undefined): Markfarg | null {
  if (ar == null || !Number.isFinite(ar) || ar < 0) return null;
  return FARGER[ar % 10] ?? null;
}
