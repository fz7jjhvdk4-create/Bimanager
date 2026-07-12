/**
 * SMHI:s öppna prognos-API (ingen nyckel krävs).
 * https://opendata.smhi.se/apidocs/metfcst/
 */

const SMHI_BAS =
  "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point";

export interface VaderPunkt {
  tid: Date;
  temperatur: number; // °C
  vind: number; // m/s
  symbol: number; // Wsymb2 1–27
  nederbord: number; // mm/h (medel)
}

export interface Prognos {
  nu: VaderPunkt;
  dagar: VaderPunkt[]; // en punkt (mitt på dagen) per kommande dag
}

const SYMBOL_TEXT: Record<number, string> = {
  1: "Klart",
  2: "Mest klart",
  3: "Växlande molnighet",
  4: "Halvklart",
  5: "Molnigt",
  6: "Mulet",
  7: "Dimma",
  8: "Lätta regnskurar",
  9: "Regnskurar",
  10: "Kraftiga regnskurar",
  11: "Åskskurar",
  12: "Byar av regn och snö",
  13: "Byar av regn och snö",
  14: "Kraftiga byar av regn och snö",
  15: "Lätta snöbyar",
  16: "Snöbyar",
  17: "Kraftiga snöbyar",
  18: "Lätt regn",
  19: "Regn",
  20: "Kraftigt regn",
  21: "Åska",
  22: "Snöblandat regn",
  23: "Snöblandat regn",
  24: "Kraftigt snöblandat regn",
  25: "Lätt snöfall",
  26: "Snöfall",
  27: "Ymnigt snöfall",
};

export function symbolText(symbol: number): string {
  return SYMBOL_TEXT[symbol] ?? "Okänt väder";
}

interface SmhiParameter {
  name: string;
  values: number[];
}

interface SmhiTidpunkt {
  validTime: string;
  parameters: SmhiParameter[];
}

function parameter(punkt: SmhiTidpunkt, namn: string): number {
  return punkt.parameters.find((p) => p.name === namn)?.values[0] ?? 0;
}

function tillVaderPunkt(punkt: SmhiTidpunkt): VaderPunkt {
  return {
    tid: new Date(punkt.validTime),
    temperatur: parameter(punkt, "t"),
    vind: parameter(punkt, "ws"),
    symbol: parameter(punkt, "Wsymb2"),
    nederbord: parameter(punkt, "pmean"),
  };
}

/**
 * Hämtar prognos för en punkt. Cachas en timme via Next:s fetch-cache.
 * Returnerar null vid fel — väder är alltid en bonus, aldrig ett krav.
 */
export async function hamtaPrognos(
  latitude: number,
  longitude: number
): Promise<Prognos | null> {
  try {
    const url = `${SMHI_BAS}/lon/${longitude.toFixed(6)}/lat/${latitude.toFixed(6)}/data.json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data: { timeSeries: SmhiTidpunkt[] } = await res.json();
    if (!data.timeSeries?.length) return null;

    const nu = tillVaderPunkt(data.timeSeries[0]);

    // En representativ punkt (närmast kl 12) per kommande dag
    const perDag = new Map<string, SmhiTidpunkt>();
    for (const punkt of data.timeSeries) {
      const tid = new Date(punkt.validTime);
      const dag = tid.toISOString().split("T")[0];
      const befintlig = perDag.get(dag);
      if (
        !befintlig ||
        Math.abs(tid.getHours() - 12) <
          Math.abs(new Date(befintlig.validTime).getHours() - 12)
      ) {
        perDag.set(dag, punkt);
      }
    }

    const idag = new Date().toISOString().split("T")[0];
    const dagar = [...perDag.entries()]
      .filter(([dag]) => dag > idag)
      .slice(0, 4)
      .map(([, punkt]) => tillVaderPunkt(punkt));

    return { nu, dagar };
  } catch (error) {
    console.error("Kunde inte hämta SMHI-prognos:", error);
    return null;
  }
}

/**
 * Enkel bedömning av om vädret passar för att öppna kupan:
 * torrt, minst ca 15 °C och måttlig vind.
 */
export function bedomInspektionsvader(punkt: VaderPunkt): {
  larmpligt: boolean;
  text: string;
} {
  const torrt = punkt.symbol <= 7;
  if (torrt && punkt.temperatur >= 15 && punkt.vind <= 5) {
    return { larmpligt: false, text: "Bra väder för att öppna kupan" };
  }
  if (torrt && punkt.temperatur >= 10 && punkt.vind <= 8) {
    return { larmpligt: false, text: "Ok för en snabb koll" };
  }
  return { larmpligt: true, text: "Vänta med att öppna kupan" };
}
