import { describe, it, expect } from "vitest";
import { recalculateFromSubmission, parseStoredJson } from "../recalculateOffer";
import type { SubmissionCondition } from "../recalculateOffer";

// Re-export parseStoredJson tests via submissionOffer — it lives there
// but we import it for clarity.

function makeCondition(overrides: Partial<SubmissionCondition> = {}): SubmissionCondition {
  return {
    overall_condition: "good",
    mileage: "35000",
    vehicle_year: "2022",
    vehicle_make: "Honda",
    vehicle_model: "Civic",
    accidents: "none",
    exterior_damage: [],
    interior_damage: [],
    mechanical_issues: [],
    engine_issues: [],
    tech_issues: [],
    windshield_damage: null,
    smoked_in: "no",
    tires_replaced: "yes",
    num_keys: "2",
    drivable: "yes",
    ...overrides,
  };
}

describe("recalculateFromSubmission", () => {
  it("returns null when bb value is 0", () => {
    const result = recalculateFromSubmission(0, makeCondition());
    expect(result).toBeNull();
  });

  it("calculates an offer from a clean submission", () => {
    const result = recalculateFromSubmission(20000, makeCondition());
    expect(result).not.toBeNull();
    expect(result!.high).toBeGreaterThan(0);
    expect(result!.baseValue).toBeGreaterThan(0);
  });

  it("applies accident deductions", () => {
    const clean = recalculateFromSubmission(20000, makeCondition());
    const accident = recalculateFromSubmission(20000, makeCondition({ accidents: "1" }));
    expect(accident!.totalDeductions).toBeGreaterThan(clean!.totalDeductions);
    expect(accident!.high).toBeLessThan(clean!.high);
  });

  it("applies exterior damage deductions", () => {
    const clean = recalculateFromSubmission(20000, makeCondition());
    const damaged = recalculateFromSubmission(20000, makeCondition({
      exterior_damage: ["dent", "scratch"],
    }));
    expect(damaged!.totalDeductions).toBeGreaterThan(clean!.totalDeductions);
  });

  it("applies smoked-in deduction", () => {
    const clean = recalculateFromSubmission(20000, makeCondition());
    const smoked = recalculateFromSubmission(20000, makeCondition({ smoked_in: "yes" }));
    expect(smoked!.totalDeductions).toBeGreaterThan(clean!.totalDeductions);
  });

  it("applies not-drivable deduction", () => {
    const clean = recalculateFromSubmission(20000, makeCondition());
    const notDrivable = recalculateFromSubmission(20000, makeCondition({ drivable: "no" }));
    expect(notDrivable!.totalDeductions).toBeGreaterThan(clean!.totalDeductions);
  });

  it("applies windshield deductions", () => {
    const clean = recalculateFromSubmission(20000, makeCondition());
    const cracked = recalculateFromSubmission(20000, makeCondition({ windshield_damage: "cracked" }));
    const chipped = recalculateFromSubmission(20000, makeCondition({ windshield_damage: "chipped" }));
    expect(cracked!.totalDeductions).toBeGreaterThan(chipped!.totalDeductions);
    expect(chipped!.totalDeductions).toBeGreaterThan(clean!.totalDeductions);
  });

  it("applies missing keys deduction", () => {
    const clean = recalculateFromSubmission(20000, makeCondition());
    const oneKey = recalculateFromSubmission(20000, makeCondition({ num_keys: "1" }));
    const noKeys = recalculateFromSubmission(20000, makeCondition({ num_keys: "0" }));
    expect(oneKey!.totalDeductions).toBeGreaterThan(clean!.totalDeductions);
    expect(noKeys!.totalDeductions).toBeGreaterThan(oneKey!.totalDeductions);
  });

  it("respects offer floor", () => {
    // Supply full BB tiers so fair → wholesale_rough resolves correctly.
    const result = recalculateFromSubmission(5000, makeCondition({
      overall_condition: "fair",
      accidents: "3+",
      drivable: "no",
      smoked_in: "yes",
      num_keys: "0",
      exterior_damage: ["dent", "scratch", "rust"],
    }), null, null, {
      bb_tradein_avg: 5000,
      bb_wholesale_avg: 4000,
      bb_value_tiers: {
        wholesale: { xclean: 4500, clean: 4200, avg: 4000, rough: 3500 },
        tradein: { clean: 5500, avg: 5000, rough: 4500 },
        retail: { xclean: 7000, clean: 6500, avg: 6000, rough: 5500 },
      },
    });
    expect(result).not.toBeNull();
    expect(result!.high).toBeGreaterThanOrEqual(500);
  });

  it("uses condition_basis_map to resolve different base values", () => {
    const excellent = recalculateFromSubmission(20000, makeCondition({ overall_condition: "excellent" }), null, null, {
      bb_tradein_avg: 20000,
      bb_retail_avg: 25000,
      bb_value_tiers: {
        retail: { xclean: 26000, clean: 25000, avg: 24000, rough: 22000 },
        tradein: { clean: 21000, avg: 20000, rough: 18000 },
        wholesale: { xclean: 19000, clean: 18000, avg: 17000, rough: 15000 },
      },
    });
    const fair = recalculateFromSubmission(20000, makeCondition({ overall_condition: "fair" }), null, null, {
      bb_tradein_avg: 20000,
      bb_retail_avg: 25000,
      bb_value_tiers: {
        retail: { xclean: 26000, clean: 25000, avg: 24000, rough: 22000 },
        tradein: { clean: 21000, avg: 20000, rough: 18000 },
        wholesale: { xclean: 19000, clean: 18000, avg: 17000, rough: 15000 },
      },
    });
    // Excellent maps to retail_xclean (26k), fair maps to wholesale_rough (15k)
    expect(excellent!.baseValue).toBeGreaterThan(fair!.baseValue);
  });
});
