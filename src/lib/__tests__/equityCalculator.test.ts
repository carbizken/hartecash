import { describe, it, expect } from "vitest";
import { calculateEquity, type EquityResult } from "../equityCalculator";

describe("calculateEquity", () => {
  it("returns 'No estimate' when vehicleValue is null", () => {
    const result = calculateEquity(null, 10000);
    expect(result.equity).toBe(0);
    expect(result.label).toBe("cold");
    expect(result.displayText).toBe("No estimate");
  });

  it("returns 'No estimate' when vehicleValue is 0", () => {
    const result = calculateEquity(0, 5000);
    expect(result.equity).toBe(0);
    expect(result.label).toBe("cold");
  });

  it("returns 'No estimate' when vehicleValue is negative", () => {
    const result = calculateEquity(-1000, 0);
    expect(result.equity).toBe(0);
    expect(result.label).toBe("cold");
  });

  it("returns 'hot' for high equity (>= $8000)", () => {
    const result = calculateEquity(25000, 10000);
    expect(result.equity).toBe(15000);
    expect(result.label).toBe("hot");
    expect(result.color).toBe("text-success");
    expect(result.displayText).toContain("15,000");
  });

  it("returns 'warm' for moderate equity ($3000-$7999)", () => {
    const result = calculateEquity(20000, 15000);
    expect(result.equity).toBe(5000);
    expect(result.label).toBe("warm");
    expect(result.displayText).toContain("5,000");
  });

  it("returns 'cold' for low equity ($0-$2999)", () => {
    const result = calculateEquity(15000, 13000);
    expect(result.equity).toBe(2000);
    expect(result.label).toBe("cold");
    expect(result.displayText).toContain("2,000");
  });

  it("returns 'negative' for underwater equity", () => {
    const result = calculateEquity(15000, 20000);
    expect(result.equity).toBe(-5000);
    expect(result.label).toBe("negative");
    expect(result.color).toBe("text-destructive");
    expect(result.displayText).toContain("Underwater");
    expect(result.displayText).toContain("5,000");
  });

  it("treats null loanPayoff as 0", () => {
    const result = calculateEquity(25000, null);
    expect(result.equity).toBe(25000);
    expect(result.label).toBe("hot");
  });

  it("returns 'hot' at exact boundary ($8000)", () => {
    const result = calculateEquity(18000, 10000);
    expect(result.equity).toBe(8000);
    expect(result.label).toBe("hot");
  });

  it("returns 'warm' at exact boundary ($3000)", () => {
    const result = calculateEquity(13000, 10000);
    expect(result.equity).toBe(3000);
    expect(result.label).toBe("warm");
  });

  it("handles zero equity correctly", () => {
    const result = calculateEquity(10000, 10000);
    expect(result.equity).toBe(0);
    expect(result.label).toBe("cold");
  });
});
