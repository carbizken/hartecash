import { describe, it, expect } from "vitest";
import {
  getStateFromZip,
  getStateTaxRate,
  getTaxRateFromZip,
  calcTradeInValue,
} from "../salesTax";

describe("getStateFromZip", () => {
  it("returns CT for Connecticut zip prefixes", () => {
    expect(getStateFromZip("06001")).toBe("CT");
    expect(getStateFromZip("06901")).toBe("CT");
  });

  it("returns NY for New York zip prefixes", () => {
    expect(getStateFromZip("10001")).toBe("NY");
    expect(getStateFromZip("14850")).toBe("NY");
  });

  it("returns NJ for New Jersey zip prefixes", () => {
    expect(getStateFromZip("07001")).toBe("NJ");
  });

  it("returns TX for Texas zip prefixes", () => {
    expect(getStateFromZip("75001")).toBe("TX");
    expect(getStateFromZip("77001")).toBe("TX");
  });

  it("returns CA for California zip prefixes", () => {
    expect(getStateFromZip("90001")).toBe("CA");
    expect(getStateFromZip("94102")).toBe("CA");
  });

  it("returns FL for Florida zip prefixes", () => {
    expect(getStateFromZip("33101")).toBe("FL");
  });

  it("returns null for empty/short zip", () => {
    expect(getStateFromZip("")).toBeNull();
    expect(getStateFromZip("06")).toBeNull();
  });

  it("returns null for unmapped zip prefix", () => {
    expect(getStateFromZip("99999")).toBeNull();
  });
});

describe("getStateTaxRate", () => {
  it("returns correct rate for known states", () => {
    expect(getStateTaxRate("CT")).toBe(0.0635);
    expect(getStateTaxRate("CA")).toBe(0.0725);
    expect(getStateTaxRate("TX")).toBe(0.0625);
  });

  it("returns 0 for no-sales-tax states", () => {
    expect(getStateTaxRate("OR")).toBe(0);
    expect(getStateTaxRate("NH")).toBe(0);
    expect(getStateTaxRate("MT")).toBe(0);
    expect(getStateTaxRate("DE")).toBe(0);
    expect(getStateTaxRate("AK")).toBe(0);
  });

  it("returns 0 for unknown state code", () => {
    expect(getStateTaxRate("XX")).toBe(0);
  });
});

describe("getTaxRateFromZip", () => {
  it("returns state and rate for valid zip", () => {
    const result = getTaxRateFromZip("06001");
    expect(result.state).toBe("CT");
    expect(result.rate).toBe(0.0635);
  });

  it("returns null state and 0 rate for unmapped zip", () => {
    const result = getTaxRateFromZip("99999");
    expect(result.state).toBeNull();
    expect(result.rate).toBe(0);
  });
});

describe("calcTradeInValue", () => {
  it("calculates trade-in value with tax savings", () => {
    // $20,000 offer at 6.35% CT tax → $20,000 * 1.0635 = $21,270
    expect(calcTradeInValue(20000, 0.0635)).toBeCloseTo(21270, 0);
  });

  it("returns same value with 0% tax", () => {
    expect(calcTradeInValue(20000, 0)).toBe(20000);
  });

  it("handles high tax rates correctly", () => {
    // CA 7.25%
    expect(calcTradeInValue(30000, 0.0725)).toBe(32175);
  });
});
