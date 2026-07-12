import { describe, expect, it } from "vitest";
import { genereraSie4, tillPc8Bytes, type SieTransaktion } from "./sie";

const forsaljning: SieTransaktion = {
  datum: "2026-03-15",
  handelseTyp: "Försäljning",
  beskrivning: "Honungsförsäljning",
  beloppExMoms: 100,
  momsSats: 0.12,
  momsBelopp: 12,
  beloppInklMoms: 112,
};

const inkop: SieTransaktion = {
  datum: "2026-02-01",
  handelseTyp: "Inköp",
  beskrivning: "Burkar",
  beloppExMoms: 80,
  momsSats: 0.25,
  momsBelopp: 20,
  beloppInklMoms: 100,
};

function verifikationsSummor(sie: string): number[] {
  const summor: number[] = [];
  let aktuell: number | null = null;
  for (const rad of sie.split("\r\n")) {
    if (rad === "{") aktuell = 0;
    else if (rad === "}") {
      if (aktuell !== null) summor.push(Math.round(aktuell * 100) / 100);
      aktuell = null;
    } else if (aktuell !== null && rad.startsWith("#TRANS")) {
      aktuell += parseFloat(rad.split(" ").pop()!);
    }
  }
  return summor;
}

describe("genereraSie4", () => {
  const sie = genereraSie4({
    ar: 2026,
    foretag: { namn: "Krattorps bigårdar", orgnr: "551122-3344" },
    transaktioner: [forsaljning, inkop],
  });

  it("innehåller obligatoriska huvudposter", () => {
    expect(sie).toContain("#FLAGGA 0");
    expect(sie).toContain("#SIETYP 4");
    expect(sie).toContain("#FORMAT PC8");
    expect(sie).toContain('#FNAMN "Krattorps bigårdar"');
    expect(sie).toContain("#ORGNR 551122-3344");
    expect(sie).toContain("#RAR 0 20260101 20261231");
  });

  it("bokför försäljning med 12 % på 3002/2621", () => {
    expect(sie).toContain("#TRANS 3002 {} -100.00");
    expect(sie).toContain("#TRANS 2621 {} -12.00");
    expect(sie).toContain("#TRANS 1930 {} 112.00");
  });

  it("bokför inköp med ingående moms på 4010/2641", () => {
    expect(sie).toContain("#TRANS 4010 {} 80.00");
    expect(sie).toContain("#TRANS 2641 {} 20.00");
    expect(sie).toContain("#TRANS 1930 {} -100.00");
  });

  it("skapar balanserade verifikationer", () => {
    const summor = verifikationsSummor(sie);
    expect(summor).toHaveLength(2);
    for (const summa of summor) expect(summa).toBe(0);
  });

  it("sorterar verifikationer i datumordning", () => {
    expect(sie.indexOf("Burkar")).toBeLessThan(
      sie.indexOf("Honungsförsäljning")
    );
  });

  it("deklarerar alla använda konton", () => {
    for (const konto of ["1930", "3002", "2621", "4010", "2641"]) {
      expect(sie).toContain(`#KONTO ${konto} `);
    }
  });

  it("ersätter citattecken i beskrivningar", () => {
    const medCitat = genereraSie4({
      ar: 2026,
      foretag: {},
      transaktioner: [
        { ...forsaljning, beskrivning: 'Honung "extra fin"' },
      ],
    });
    expect(medCitat).toContain("\"Honung 'extra fin'\"");
  });
});

describe("tillPc8Bytes", () => {
  it("kodar svenska tecken enligt CP437", () => {
    const bytes = tillPc8Bytes("åäöÅÄÖ");
    expect([...bytes]).toEqual([0x86, 0x84, 0x94, 0x8f, 0x8e, 0x99]);
  });

  it("släpper igenom ASCII oförändrat", () => {
    const bytes = tillPc8Bytes("#TRANS 1930");
    expect(String.fromCharCode(...bytes)).toBe("#TRANS 1930");
  });

  it("ersätter okända tecken med frågetecken", () => {
    expect([...tillPc8Bytes("€")]).toEqual([0x3f]);
  });
});
