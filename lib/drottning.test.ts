import { describe, expect, it } from "vitest";
import { markfarg } from "./drottning";

describe("markfarg", () => {
  it("följer den internationella femårscykeln", () => {
    expect(markfarg(2026)?.namn).toBe("Vit");
    expect(markfarg(2027)?.namn).toBe("Gul");
    expect(markfarg(2028)?.namn).toBe("Röd");
    expect(markfarg(2029)?.namn).toBe("Grön");
    expect(markfarg(2030)?.namn).toBe("Blå");
    expect(markfarg(2031)?.namn).toBe("Vit");
  });

  it("hanterar saknat år", () => {
    expect(markfarg(null)).toBeNull();
    expect(markfarg(undefined)).toBeNull();
  });
});
