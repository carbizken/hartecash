import { describe, it, expect } from "vitest";
import { formatPhone } from "../utils";

describe("formatPhone", () => {
  it("formats 10-digit number", () => {
    expect(formatPhone("5551234567")).toBe("(555) 123-4567");
  });

  it("formats 11-digit number starting with 1", () => {
    expect(formatPhone("15551234567")).toBe("(555) 123-4567");
  });

  it("strips non-digit characters before formatting", () => {
    expect(formatPhone("(555) 123-4567")).toBe("(555) 123-4567");
    expect(formatPhone("555-123-4567")).toBe("(555) 123-4567");
    expect(formatPhone("555.123.4567")).toBe("(555) 123-4567");
  });

  it("returns original for non-standard lengths", () => {
    expect(formatPhone("12345")).toBe("12345");
    expect(formatPhone("123456789012")).toBe("123456789012");
  });

  it("returns empty string for null/undefined", () => {
    expect(formatPhone(null)).toBe("");
    expect(formatPhone(undefined)).toBe("");
  });

  it("returns empty string for empty string", () => {
    expect(formatPhone("")).toBe("");
  });
});
