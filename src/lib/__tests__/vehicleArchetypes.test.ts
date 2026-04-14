import { describe, it, expect } from "vitest";
import { classToArchetype } from "../vehicleArchetypes";

describe("classToArchetype", () => {
  it("maps sedan classes", () => {
    expect(classToArchetype("sedan")).toBe("sedan");
    expect(classToArchetype("Compact Car")).toBe("sedan");
    expect(classToArchetype("Mid-Size Car")).toBe("sedan");
    expect(classToArchetype("Luxury Car")).toBe("sedan");
    expect(classToArchetype("coupe")).toBe("sedan");
  });

  it("maps SUV classes", () => {
    expect(classToArchetype("Compact Sport Utility")).toBe("compact_suv");
    expect(classToArchetype("Mid-Size Sport Utility")).toBe("midsize_suv");
    expect(classToArchetype("Full-Size Sport Utility")).toBe("large_suv");
  });

  it("maps truck classes", () => {
    expect(classToArchetype("Full-Size Pickup")).toBe("truck");
    expect(classToArchetype("compact pickup")).toBe("truck");
    expect(classToArchetype("Heavy Duty Pickup")).toBe("truck");
  });

  it("maps van classes", () => {
    expect(classToArchetype("minivan")).toBe("van");
    expect(classToArchetype("Cargo Van")).toBe("van");
    expect(classToArchetype("Passenger Van")).toBe("van");
  });

  it("defaults to sedan for null/undefined/unknown", () => {
    expect(classToArchetype(null)).toBe("sedan");
    expect(classToArchetype(undefined)).toBe("sedan");
    expect(classToArchetype("")).toBe("sedan");
    expect(classToArchetype("Unknown Vehicle Type")).toBe("sedan");
  });

  it("is case-insensitive", () => {
    expect(classToArchetype("SEDAN")).toBe("sedan");
    expect(classToArchetype("MINIVAN")).toBe("van");
    expect(classToArchetype("Full-Size Pickup")).toBe("truck");
  });
});
