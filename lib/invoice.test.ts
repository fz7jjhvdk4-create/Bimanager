import { describe, it, expect } from "vitest";
import {
  calculateInvoiceTotals,
  nextSequenceNumber,
  formatSequenceNumber,
  yearPrefix,
  invoiceLinesSchema,
} from "./invoice";

describe("calculateInvoiceTotals", () => {
  it("beräknar totaler för en rad med standardmoms 12%", () => {
    const result = calculateInvoiceTotals([
      { beskrivning: "Honung 700g", antal: 10, enhet: "st", prisPerEnhet: 90 },
    ]);
    expect(result.totaltExMoms).toBe(900);
    expect(result.totaltMoms).toBe(108);
    expect(result.totaltInklMoms).toBe(1008);
  });

  it("avrundar varje rad till hela kronor", () => {
    const result = calculateInvoiceTotals([
      { beskrivning: "Honung", antal: 3, enhet: "st", prisPerEnhet: 33.33 },
    ]);
    expect(result.totaltExMoms).toBe(100);
    expect(result.totaltMoms).toBe(12);
    expect(result.totaltInklMoms).toBe(112);
  });

  it("hanterar flera rader med olika momssatser", () => {
    const result = calculateInvoiceTotals([
      { beskrivning: "Honung", antal: 5, enhet: "st", prisPerEnhet: 100, momsSats: 0.12 },
      { beskrivning: "Vaxljus", antal: 2, enhet: "st", prisPerEnhet: 50, momsSats: 0.25 },
    ]);
    expect(result.totaltExMoms).toBe(600);
    expect(result.totaltMoms).toBe(60 + 25);
    expect(result.totaltInklMoms).toBe(685);
  });
});

describe("nextSequenceNumber", () => {
  it("börjar på 1 när inga nummer finns", () => {
    expect(nextSequenceNumber([], "F26")).toBe(1);
  });

  it("räknar upp från högsta befintliga nummer", () => {
    expect(nextSequenceNumber(["F26001", "F26005", "F26003"], "F26")).toBe(6);
  });

  it("jämför numeriskt så att 1000 följer på 999", () => {
    expect(nextSequenceNumber(["F26999", "F261000"], "F26")).toBe(1001);
  });

  it("ignorerar nummer med annat prefix", () => {
    expect(nextSequenceNumber(["K26007", "F26002"], "F26")).toBe(3);
  });
});

describe("formatSequenceNumber", () => {
  it("nollutfyller till tre siffror", () => {
    expect(formatSequenceNumber("F26", 5)).toBe("F26005");
  });

  it("växer utan trunkering över 999", () => {
    expect(formatSequenceNumber("F26", 1000)).toBe("F261000");
  });
});

describe("yearPrefix", () => {
  it("använder årets två sista siffror", () => {
    expect(yearPrefix("F", new Date("2026-07-11"))).toBe("F26");
    expect(yearPrefix("KV", new Date("2031-01-01"))).toBe("KV31");
  });
});

describe("invoiceLinesSchema", () => {
  it("godkänner giltiga rader", () => {
    const result = invoiceLinesSchema.safeParse([
      { beskrivning: "Honung", antal: 1, enhet: "st", prisPerEnhet: 90 },
    ]);
    expect(result.success).toBe(true);
  });

  it("avvisar tom lista", () => {
    expect(invoiceLinesSchema.safeParse([]).success).toBe(false);
  });

  it("avvisar negativt pris och antal noll", () => {
    expect(
      invoiceLinesSchema.safeParse([
        { beskrivning: "Honung", antal: 0, enhet: "st", prisPerEnhet: 90 },
      ]).success
    ).toBe(false);
    expect(
      invoiceLinesSchema.safeParse([
        { beskrivning: "Honung", antal: 1, enhet: "st", prisPerEnhet: -5 },
      ]).success
    ).toBe(false);
  });
});
