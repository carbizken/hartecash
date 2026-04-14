import { describe, it, expect } from "vitest";
import { hasLoanFromStatus } from "../consent";

describe("hasLoanFromStatus", () => {
  it("returns false for null/undefined/empty", () => {
    expect(hasLoanFromStatus(null)).toBe(false);
    expect(hasLoanFromStatus(undefined)).toBe(false);
    expect(hasLoanFromStatus("")).toBe(false);
  });

  it("returns true for active loan statuses", () => {
    expect(hasLoanFromStatus("loan")).toBe(true);
    expect(hasLoanFromStatus("has a loan")).toBe(true);
    expect(hasLoanFromStatus("financed")).toBe(true);
    expect(hasLoanFromStatus("lease")).toBe(true);
    expect(hasLoanFromStatus("lien on title")).toBe(true);
  });

  it("returns false for paid-off/no-loan statuses", () => {
    expect(hasLoanFromStatus("no_loan")).toBe(false);
    expect(hasLoanFromStatus("paid off")).toBe(false);
    expect(hasLoanFromStatus("own outright")).toBe(false);
    expect(hasLoanFromStatus("free and clear")).toBe(false);
  });

  it("returns false for non-loan statuses", () => {
    expect(hasLoanFromStatus("other")).toBe(false);
    expect(hasLoanFromStatus("unsure")).toBe(false);
  });
});
