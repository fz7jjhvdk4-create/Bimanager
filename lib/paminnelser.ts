/**
 * Urvals- och formateringslogik för dagliga påminnelsemejl.
 * Hålls fri från Prisma/Next så att den kan enhetstestas.
 */

export interface UtskicksPaminnelse {
  titel: string;
  datum: Date;
  paminnaFor: number; // dagar före datum som påminnelsen ska börja skickas
  utford: boolean;
  kategori: string;
  samhalleNamn?: string | null;
  bigardNamn?: string | null;
}

function midnatt(datum: Date): Date {
  const d = new Date(datum);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Ska påminnelsen med i dagens utskick? Ja från `paminnaFor` dagar före
 * datumet, och fortsatt varje dag tills den bockas av (försenade inkluderas).
 */
export function skaPaminnas(
  paminnelse: Pick<UtskicksPaminnelse, "datum" | "paminnaFor" | "utford">,
  idag: Date
): boolean {
  if (paminnelse.utford) return false;
  const start = midnatt(paminnelse.datum);
  start.setDate(start.getDate() - paminnelse.paminnaFor);
  return start <= midnatt(idag);
}

export function grupperaPaminnelser<T extends { datum: Date }>(
  paminnelser: T[],
  idag: Date
): { forsenade: T[]; idagens: T[]; kommande: T[] } {
  const dag = midnatt(idag).getTime();
  return {
    forsenade: paminnelser.filter((p) => midnatt(p.datum).getTime() < dag),
    idagens: paminnelser.filter((p) => midnatt(p.datum).getTime() === dag),
    kommande: paminnelser.filter((p) => midnatt(p.datum).getTime() > dag),
  };
}

function beskrivRad(p: UtskicksPaminnelse): string {
  const plats = p.samhalleNamn || p.bigardNamn;
  const datum = p.datum.toLocaleDateString("sv-SE");
  return `- ${p.titel} (${p.kategori}${plats ? `, ${plats}` : ""}) – ${datum}`;
}

export function byggMejltext(
  namn: string | null,
  paminnelser: UtskicksPaminnelse[],
  idag: Date
): string {
  const { forsenade, idagens, kommande } = grupperaPaminnelser(
    paminnelser,
    idag
  );

  const delar: string[] = [`Hej${namn ? ` ${namn}` : ""}!`, ""];
  delar.push(
    `Du har ${paminnelser.length} aktuell${paminnelser.length === 1 ? "" : "a"} påminnelse${paminnelser.length === 1 ? "" : "r"} i BiManager:`
  );

  if (forsenade.length > 0) {
    delar.push("", "Försenade:");
    delar.push(...forsenade.map(beskrivRad));
  }
  if (idagens.length > 0) {
    delar.push("", "Idag:");
    delar.push(...idagens.map(beskrivRad));
  }
  if (kommande.length > 0) {
    delar.push("", "Kommande:");
    delar.push(...kommande.map(beskrivRad));
  }

  delar.push(
    "",
    "Logga in i BiManager för att bocka av det du gjort.",
    "",
    "/BiManager"
  );

  return delar.join("\n");
}
