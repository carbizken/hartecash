import { describe, it, expect } from "vitest";
import { formatGrade } from "../formatGrade";

describe("formatGrade", () => {
  it("converts snake_case to Title Case", () => {
    expect(formatGrade("very_good")).toBe("Very Good");
  });

  it("capitalizes single word", () => {
    expect(formatGrade("good")).toBe("Good");
    expect(formatGrade("excellent")).toBe("Excellent");
    expect(formatGrade("fair")).toBe("Fair");
  });

  it("returns empty string for null", () => {
    expect(formatGrade(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatGrade(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatGrade("")).toBe("");
  });
});
