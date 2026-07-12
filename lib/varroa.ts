/**
 * Beräkningar och tröskelbedömning för varroamätningar.
 *
 * Trösklarna är riktvärden baserade på vanlig svensk rådgivning
 * (SLU/Jordbruksverket): jämför alltid med aktuella rekommendationer.
 * Hålls fri från Prisma/Next så att den kan enhetstestas.
 */

export type VarroaNiva = "ok" | "varning" | "atgard";

export interface VarroaBedomning {
  niva: VarroaNiva;
  text: string;
}

/** Angreppsgrad i procent: kvalster per bin i provet (vanligen ~300 bin). */
export function beraknaAngreppsgrad(
  antalKvalster: number,
  antalBin: number
): number {
  if (antalBin <= 0) return 0;
  return Math.round((antalKvalster / antalBin) * 1000) / 10;
}

/** Naturligt nedfall per dygn. */
export function beraknaNedfallPerDygn(
  antalKvalster: number,
  antalDygn: number
): number {
  if (antalDygn <= 0) return 0;
  return Math.round((antalKvalster / antalDygn) * 10) / 10;
}

/**
 * Bedömer angreppsgrad från alkoholtvätt/sockerprov.
 * Riktvärde under säsong: ≥3 % behandla, 1–3 % håll koll.
 */
export function bedomAngreppsgrad(angreppsgrad: number): VarroaBedomning {
  if (angreppsgrad >= 3) {
    return {
      niva: "atgard",
      text: `${angreppsgrad} % angreppsgrad — behandling rekommenderas`,
    };
  }
  if (angreppsgrad >= 1) {
    return {
      niva: "varning",
      text: `${angreppsgrad} % angreppsgrad — förhöjt, mät igen inom 2–3 veckor`,
    };
  }
  return { niva: "ok", text: `${angreppsgrad} % angreppsgrad — låg nivå` };
}

/**
 * Bedömer naturligt nedfall per dygn med säsongsberoende riktvärden:
 * mars–juni ≥5/dygn, juli–augusti ≥10/dygn, september–februari ≥3/dygn
 * indikerar behandlingsbehov.
 */
export function bedomNedfall(
  nedfallPerDygn: number,
  datum: Date
): VarroaBedomning {
  const manad = datum.getMonth() + 1; // 1–12
  let atgardsgrans: number;
  let varningsgrans: number;

  if (manad >= 3 && manad <= 6) {
    atgardsgrans = 5;
    varningsgrans = 2;
  } else if (manad >= 7 && manad <= 8) {
    atgardsgrans = 10;
    varningsgrans = 5;
  } else {
    atgardsgrans = 3;
    varningsgrans = 1;
  }

  if (nedfallPerDygn >= atgardsgrans) {
    return {
      niva: "atgard",
      text: `${nedfallPerDygn} kvalster/dygn — behandling rekommenderas`,
    };
  }
  if (nedfallPerDygn >= varningsgrans) {
    return {
      niva: "varning",
      text: `${nedfallPerDygn} kvalster/dygn — förhöjt, följ upp`,
    };
  }
  return { niva: "ok", text: `${nedfallPerDygn} kvalster/dygn — låg nivå` };
}

/** Bedömer en mätning utifrån metod och tillgängliga värden. */
export function bedomVarroa(matning: {
  metod: string;
  angreppsgrad?: number;
  nedfallPerDygn?: number;
  datum: Date;
}): VarroaBedomning | null {
  if (matning.metod === "Nedfall" && matning.nedfallPerDygn !== undefined) {
    return bedomNedfall(matning.nedfallPerDygn, matning.datum);
  }
  if (matning.angreppsgrad !== undefined) {
    return bedomAngreppsgrad(matning.angreppsgrad);
  }
  return null;
}
