import { describe, expect, it } from "vitest";
import { beraknaMoms } from "./accounting";

describe("beraknaMoms", () => {
  it("beräknar 12 % moms avrundat till 2 decimaler", () => {
    expect(beraknaMoms(100, 0.12)).toEqual({
      momsBelopp: 12,
      beloppInklMoms: 112,
    });
  });

  it("avrundar momsbelopp med många decimaler", () => {
    // 33.33 * 0.12 = 3.9996 -> 4.00
    expect(beraknaMoms(33.33, 0.12)).toEqual({
      momsBelopp: 4,
      beloppInklMoms: 37.33,
    });
  });

  it("ger samma resultat vid redigering som vid skapande (regressionstest)", () => {
    // Tidigare avrundade PUT inte alls: 79.9 * 0.12 = 9.588
    const { momsBelopp, beloppInklMoms } = beraknaMoms(79.9, 0.12);
    expect(momsBelopp).toBe(9.59);
    expect(beloppInklMoms).toBe(89.49);
  });

  it("hanterar momssats 0", () => {
    expect(beraknaMoms(250, 0)).toEqual({
      momsBelopp: 0,
      beloppInklMoms: 250,
    });
  });

  it("hanterar 25 % moms", () => {
    expect(beraknaMoms(80, 0.25)).toEqual({
      momsBelopp: 20,
      beloppInklMoms: 100,
    });
  });
});
