import { z } from "zod";

/**
 * Delad logik för fakturor och kvitton: validering av produktrader,
 * momsberäkning och generering av löpnummer.
 */

export const invoiceLineSchema = z.object({
  beskrivning: z.string().min(1, "Beskrivning krävs"),
  antal: z.number().positive("Antal måste vara större än 0"),
  enhet: z.string().min(1),
  prisPerEnhet: z.number().nonnegative("Pris kan inte vara negativt"),
  momsSats: z.number().min(0).max(1).optional(),
});

export const invoiceLinesSchema = z
  .array(invoiceLineSchema)
  .min(1, "Minst en produktrad krävs");

export type InvoiceLine = z.infer<typeof invoiceLineSchema>;

/**
 * Beräknar totaler för en uppsättning produktrader,
 * avrundat till hela kronor per rad.
 */
export function calculateInvoiceTotals(rader: InvoiceLine[]) {
  let totaltExMoms = 0;
  let totaltMoms = 0;

  for (const rad of rader) {
    const radBelopp = Math.round(rad.antal * rad.prisPerEnhet);
    const radMoms = Math.round(radBelopp * (rad.momsSats ?? 0.12));
    totaltExMoms += radBelopp;
    totaltMoms += radMoms;
  }

  return {
    totaltExMoms,
    totaltMoms,
    totaltInklMoms: totaltExMoms + totaltMoms,
  };
}

/**
 * Räknar fram nästa löpnummer givet befintliga nummer med samma prefix.
 * Jämför numeriskt (inte som strängar) så att t.ex. 1000 följer på 999.
 */
export function nextSequenceNumber(existing: string[], prefix: string): number {
  let max = 0;
  for (const nummer of existing) {
    if (!nummer.startsWith(prefix)) continue;
    const n = parseInt(nummer.slice(prefix.length), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

/**
 * Formaterar ett löpnummer, t.ex. ("F26", 5) -> "F26005".
 */
export function formatSequenceNumber(prefix: string, n: number): string {
  return `${prefix}${n.toString().padStart(3, "0")}`;
}

/**
 * Årsprefix för fakturanummer, t.ex. "F26" eller "KV26".
 */
export function yearPrefix(base: string, date: Date = new Date()): string {
  return `${base}${date.getFullYear().toString().slice(-2)}`;
}
