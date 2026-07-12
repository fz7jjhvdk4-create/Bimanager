import { describe, expect, it } from "vitest";
import {
  byggMejltext,
  grupperaPaminnelser,
  skaPaminnas,
  type UtskicksPaminnelse,
} from "./paminnelser";

const IDAG = new Date("2026-07-12T09:00:00");

function paminnelse(
  datum: string,
  paminnaFor = 1,
  utford = false
): Pick<UtskicksPaminnelse, "datum" | "paminnaFor" | "utford"> {
  return { datum: new Date(datum), paminnaFor, utford };
}

describe("skaPaminnas", () => {
  it("tar med påminnelser vars förvarningsfönster har börjat", () => {
    expect(skaPaminnas(paminnelse("2026-07-13", 1), IDAG)).toBe(true);
    expect(skaPaminnas(paminnelse("2026-07-15", 3), IDAG)).toBe(true);
  });

  it("hoppar över påminnelser vars fönster inte börjat", () => {
    expect(skaPaminnas(paminnelse("2026-07-14", 1), IDAG)).toBe(false);
    expect(skaPaminnas(paminnelse("2026-08-01", 7), IDAG)).toBe(false);
  });

  it("tar med påminnelser på själva dagen", () => {
    expect(skaPaminnas(paminnelse("2026-07-12", 0), IDAG)).toBe(true);
  });

  it("tar med försenade påminnelser tills de bockas av", () => {
    expect(skaPaminnas(paminnelse("2026-07-01", 1), IDAG)).toBe(true);
  });

  it("hoppar över utförda påminnelser", () => {
    expect(skaPaminnas(paminnelse("2026-07-12", 1, true), IDAG)).toBe(false);
  });

  it("ignorerar klockslag — jämför hela dagar", () => {
    const senIkvall = new Date("2026-07-13T23:59:00");
    expect(
      skaPaminnas({ datum: senIkvall, paminnaFor: 1, utford: false }, IDAG)
    ).toBe(true);
  });
});

describe("grupperaPaminnelser", () => {
  it("delar upp i försenade, idag och kommande", () => {
    const lista = [
      { datum: new Date("2026-07-10") },
      { datum: new Date("2026-07-12") },
      { datum: new Date("2026-07-14") },
    ];
    const { forsenade, idagens, kommande } = grupperaPaminnelser(lista, IDAG);
    expect(forsenade).toHaveLength(1);
    expect(idagens).toHaveLength(1);
    expect(kommande).toHaveLength(1);
  });
});

describe("byggMejltext", () => {
  it("bygger ett läsbart mejl med sektioner", () => {
    const lista: UtskicksPaminnelse[] = [
      {
        titel: "Varroabehandling",
        datum: new Date("2026-07-10"),
        paminnaFor: 1,
        utford: false,
        kategori: "Varroabehandling",
        samhalleNamn: "Samhälle 3",
      },
      {
        titel: "Skattlådor på",
        datum: new Date("2026-07-14"),
        paminnaFor: 3,
        utford: false,
        kategori: "Övrigt",
        bigardNamn: "Södra bigården",
      },
    ];
    const text = byggMejltext("Claes", lista, IDAG);
    expect(text).toContain("Hej Claes!");
    expect(text).toContain("2 aktuella påminnelser");
    expect(text).toContain("Försenade:");
    expect(text).toContain("Varroabehandling (Varroabehandling, Samhälle 3)");
    expect(text).toContain("Kommande:");
    expect(text).toContain("Skattlådor på (Övrigt, Södra bigården)");
    expect(text).not.toContain("Idag:");
  });

  it("böjer singular korrekt", () => {
    const lista: UtskicksPaminnelse[] = [
      {
        titel: "Inspektion",
        datum: new Date("2026-07-12"),
        paminnaFor: 0,
        utford: false,
        kategori: "Inspektion",
      },
    ];
    expect(byggMejltext(null, lista, IDAG)).toContain("1 aktuell påminnelse");
  });
});
