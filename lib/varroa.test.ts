import { describe, expect, it } from "vitest";
import {
  bedomAngreppsgrad,
  bedomNedfall,
  bedomVarroa,
  beraknaAngreppsgrad,
  beraknaNedfallPerDygn,
} from "./varroa";

describe("beraknaAngreppsgrad", () => {
  it("beräknar procent med en decimal", () => {
    expect(beraknaAngreppsgrad(9, 300)).toBe(3);
    expect(beraknaAngreppsgrad(5, 300)).toBe(1.7);
    expect(beraknaAngreppsgrad(0, 300)).toBe(0);
  });

  it("hanterar ogiltigt binantal", () => {
    expect(beraknaAngreppsgrad(5, 0)).toBe(0);
  });
});

describe("beraknaNedfallPerDygn", () => {
  it("beräknar nedfall per dygn med en decimal", () => {
    expect(beraknaNedfallPerDygn(35, 7)).toBe(5);
    expect(beraknaNedfallPerDygn(10, 3)).toBe(3.3);
  });

  it("hanterar ogiltigt antal dygn", () => {
    expect(beraknaNedfallPerDygn(10, 0)).toBe(0);
  });
});

describe("bedomAngreppsgrad", () => {
  it("rekommenderar behandling från 3 %", () => {
    expect(bedomAngreppsgrad(3).niva).toBe("atgard");
    expect(bedomAngreppsgrad(7.5).niva).toBe("atgard");
  });

  it("varnar mellan 1 och 3 %", () => {
    expect(bedomAngreppsgrad(1).niva).toBe("varning");
    expect(bedomAngreppsgrad(2.9).niva).toBe("varning");
  });

  it("ger ok under 1 %", () => {
    expect(bedomAngreppsgrad(0.9).niva).toBe("ok");
    expect(bedomAngreppsgrad(0).niva).toBe("ok");
  });
});

describe("bedomNedfall", () => {
  const varDatum = new Date("2026-05-15");
  const sommarDatum = new Date("2026-07-20");
  const hostDatum = new Date("2026-10-01");

  it("använder vårtröskel mars–juni (åtgärd ≥5)", () => {
    expect(bedomNedfall(5, varDatum).niva).toBe("atgard");
    expect(bedomNedfall(3, varDatum).niva).toBe("varning");
    expect(bedomNedfall(1, varDatum).niva).toBe("ok");
  });

  it("använder sommartröskel juli–augusti (åtgärd ≥10)", () => {
    expect(bedomNedfall(10, sommarDatum).niva).toBe("atgard");
    expect(bedomNedfall(7, sommarDatum).niva).toBe("varning");
    expect(bedomNedfall(4, sommarDatum).niva).toBe("ok");
  });

  it("använder höst-/vintertröskel september–februari (åtgärd ≥3)", () => {
    expect(bedomNedfall(3, hostDatum).niva).toBe("atgard");
    expect(bedomNedfall(1.5, hostDatum).niva).toBe("varning");
    expect(bedomNedfall(0.5, hostDatum).niva).toBe("ok");
  });
});

describe("bedomVarroa", () => {
  it("väljer nedfallsbedömning för nedfallsmätning", () => {
    const bedomning = bedomVarroa({
      metod: "Nedfall",
      nedfallPerDygn: 12,
      datum: new Date("2026-07-20"),
    });
    expect(bedomning?.niva).toBe("atgard");
  });

  it("väljer angreppsgrad för alkoholtvätt", () => {
    const bedomning = bedomVarroa({
      metod: "Alkoholtvätt",
      angreppsgrad: 0.5,
      datum: new Date("2026-07-20"),
    });
    expect(bedomning?.niva).toBe("ok");
  });

  it("returnerar null när värden saknas", () => {
    expect(bedomVarroa({ metod: "Nedfall", datum: new Date() })).toBeNull();
  });
});
