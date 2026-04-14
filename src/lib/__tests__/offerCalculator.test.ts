import { describe, it, expect } from "vitest";
import {
  calcLowMileageBonusPct,
  calcHighMileagePenaltyPct,
  calcColorAdjustmentPct,
  calcAIConditionAdjustment,
  calculateOffer,
  DEFAULT_LOW_MILEAGE_BONUS,
  DEFAULT_HIGH_MILEAGE_PENALTY,
  DEFAULT_COLOR_DESIRABILITY,
  DEFAULT_DEDUCTION_AMOUNTS,
  type LowMileageBonus,
  type HighMileagePenalty,
  type ColorDesirability,
} from "../offerCalculator";
import type { BBVehicle, FormData } from "@/components/sell-form/types";

// ─── Helpers ───────────────────────────────────────────────
function makeBBVehicle(overrides: Partial<BBVehicle> = {}): BBVehicle {
  return {
    uvc: "UVC123",
    vin: "1HGCG5654WA043112",
    year: "2022",
    make: "Honda",
    model: "Civic",
    series: "EX",
    style: "4D Sedan",
    class_name: "Mid-Size Car",
    msrp: 25000,
    price_includes: "",
    drivetrain: "FWD",
    transmission: "Automatic",
    engine: "2.0L 4-Cyl",
    fuel_type: "Gasoline",
    exterior_colors: [],
    mileage_adj: 0,
    regional_adj: 0,
    base_whole_avg: 18000,
    add_deduct_list: [],
    wholesale: { xclean: 20000, clean: 19000, avg: 18000, rough: 16000 },
    tradein: { clean: 21000, avg: 20000, rough: 18000 },
    retail: { xclean: 25000, clean: 24000, avg: 23000, rough: 21000 },
    ...overrides,
  };
}

function makeFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    plate: "",
    state: "",
    vin: "1HGCG5654WA043112",
    mileage: "35000",
    bbUvc: "UVC123",
    bbSelectedAddDeducts: [],
    exteriorColor: "white",
    drivetrain: "FWD",
    modifications: "",
    overallCondition: "good",
    exteriorDamage: [],
    windshieldDamage: "",
    moonroof: "",
    interiorDamage: [],
    techIssues: [],
    engineIssues: [],
    mechanicalIssues: [],
    drivable: "yes",
    accidents: "none",
    smokedIn: "no",
    tiresReplaced: "yes",
    numKeys: "2",
    name: "Test User",
    phone: "5551234567",
    email: "test@example.com",
    zip: "06001",
    loanStatus: "",
    loanCompany: "",
    loanBalance: "",
    loanPayment: "",
    nextStep: "",
    preferredLocationId: "",
    salespersonName: "",
    manualYear: "",
    manualMake: "",
    manualModel: "",
    ...overrides,
  };
}

// ─── calcLowMileageBonusPct ────────────────────────────────
describe("calcLowMileageBonusPct", () => {
  const enabled: LowMileageBonus = {
    ...DEFAULT_LOW_MILEAGE_BONUS,
    enabled: true,
  };

  it("returns 0 when disabled", () => {
    expect(calcLowMileageBonusPct("2020", 30000, DEFAULT_LOW_MILEAGE_BONUS)).toBe(0);
  });

  it("returns 0 when vehicleYear is undefined", () => {
    expect(calcLowMileageBonusPct(undefined, 30000, enabled)).toBe(0);
  });

  it("returns 0 when miles/year >= avg", () => {
    // 5 years old, 60000 miles = 12000/year = avg → no bonus
    expect(calcLowMileageBonusPct("2021", 60000, enabled)).toBe(0);
  });

  it("returns bonus for low mileage", () => {
    // 5 year old car, 25000 miles = 5000 mi/yr → well below 12000 avg
    const result = calcLowMileageBonusPct("2021", 25000, enabled);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(enabled.max_bonus_pct);
  });

  it("caps bonus at max_bonus_pct", () => {
    // 5 year old car, 20500 miles = 4100/yr → just above min, very low → hits cap
    const result = calcLowMileageBonusPct("2021", 20500, enabled);
    expect(result).toBeLessThanOrEqual(enabled.max_bonus_pct);
  });

  it("returns 0 if below min_miles_per_year", () => {
    // 5 year old, 10000 miles = 2000/yr → below min of 4000
    expect(calcLowMileageBonusPct("2021", 10000, enabled)).toBe(0);
  });
});

// ─── calcHighMileagePenaltyPct ─────────────────────────────
describe("calcHighMileagePenaltyPct", () => {
  const enabled: HighMileagePenalty = {
    ...DEFAULT_HIGH_MILEAGE_PENALTY,
    enabled: true,
  };

  it("returns 0 when disabled", () => {
    expect(calcHighMileagePenaltyPct("2020", 100000, DEFAULT_HIGH_MILEAGE_PENALTY)).toBe(0);
  });

  it("returns 0 when vehicleYear is undefined", () => {
    expect(calcHighMileagePenaltyPct(undefined, 100000, enabled)).toBe(0);
  });

  it("returns 0 when miles/year <= avg", () => {
    // 5 year old car, 50000 miles = 10000/yr → below 12000 avg
    expect(calcHighMileagePenaltyPct("2021", 50000, enabled)).toBe(0);
  });

  it("returns penalty for high mileage", () => {
    // 5 year old car, 100000 miles = 20000/yr → above avg 12000
    const result = calcHighMileagePenaltyPct("2021", 100000, enabled);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(enabled.max_penalty_pct);
  });

  it("returns 0 if above max_miles_per_year", () => {
    // 5 year old, 150000 miles = 30000/yr → above max of 25000
    expect(calcHighMileagePenaltyPct("2021", 150000, enabled)).toBe(0);
  });
});

// ─── calcColorAdjustmentPct ────────────────────────────────
describe("calcColorAdjustmentPct", () => {
  const enabled: ColorDesirability = {
    ...DEFAULT_COLOR_DESIRABILITY,
    enabled: true,
  };

  it("returns 0 when disabled", () => {
    expect(calcColorAdjustmentPct("white", DEFAULT_COLOR_DESIRABILITY)).toBe(0);
  });

  it("returns 0 when no color provided", () => {
    expect(calcColorAdjustmentPct(undefined, enabled)).toBe(0);
  });

  it("returns positive adjustment for desirable colors", () => {
    expect(calcColorAdjustmentPct("white", enabled)).toBe(2);
    expect(calcColorAdjustmentPct("Black", enabled)).toBe(2);
  });

  it("returns negative adjustment for undesirable colors", () => {
    expect(calcColorAdjustmentPct("yellow", enabled)).toBe(-3);
    expect(calcColorAdjustmentPct("Purple", enabled)).toBe(-2);
  });

  it("matches partial color strings", () => {
    expect(calcColorAdjustmentPct("Pearl White", enabled)).toBe(2);
  });

  it("returns 0 for unknown colors", () => {
    expect(calcColorAdjustmentPct("chartreuse", enabled)).toBe(0);
  });
});

// ─── calcAIConditionAdjustment ─────────────────────────────
describe("calcAIConditionAdjustment", () => {
  it("returns 0 when no AI score", () => {
    expect(calcAIConditionAdjustment(20000, "good", null, null)).toBe(0);
  });

  it("returns 0 when confidence too low", () => {
    expect(calcAIConditionAdjustment(20000, "good", "fair", "some damage", 50)).toBe(0);
  });

  it("returns 0 when AI matches reported", () => {
    expect(calcAIConditionAdjustment(20000, "good", "good", null, 90)).toBe(0);
  });

  it("penalizes when AI detects worse than reported", () => {
    const result = calcAIConditionAdjustment(20000, "excellent", "fair", "damage", 90);
    expect(result).toBeGreaterThan(0); // penalty = more deduction
  });

  it("rewards when AI detects better than reported", () => {
    const result = calcAIConditionAdjustment(20000, "fair", "good", null, 90);
    expect(result).toBeLessThan(0); // reward = less deduction
  });

  it("caps adjustment at ±$1500", () => {
    // Large base value, 3-gap penalty (15%) → should be capped
    const result = calcAIConditionAdjustment(50000, "excellent", "fair", "severe", 95);
    expect(result).toBeLessThanOrEqual(1500);

    const reward = calcAIConditionAdjustment(100000, "fair", "excellent", null, 95);
    expect(reward).toBeGreaterThanOrEqual(-1500);
  });
});

// ─── calculateOffer (integration) ──────────────────────────
describe("calculateOffer", () => {
  it("returns null when bbVehicle is null", () => {
    expect(calculateOffer(null, makeFormData(), [])).toBeNull();
  });

  it("returns a valid estimate for a clean vehicle", () => {
    const result = calculateOffer(makeBBVehicle(), makeFormData(), []);
    expect(result).not.toBeNull();
    expect(result!.high).toBeGreaterThan(0);
    expect(result!.baseValue).toBeGreaterThan(0);
    expect(result!.totalDeductions).toBe(0); // no damage reported
  });

  it("applies accident deductions", () => {
    const clean = calculateOffer(makeBBVehicle(), makeFormData(), []);
    const damaged = calculateOffer(
      makeBBVehicle(),
      makeFormData({ accidents: "1" }),
      [],
    );
    expect(damaged!.high).toBeLessThan(clean!.high);
    expect(damaged!.totalDeductions).toBeGreaterThan(0);
  });

  it("applies exterior damage deductions", () => {
    const clean = calculateOffer(makeBBVehicle(), makeFormData(), []);
    const damaged = calculateOffer(
      makeBBVehicle(),
      makeFormData({ exteriorDamage: ["dent", "scratch"] }),
      [],
    );
    expect(damaged!.high).toBeLessThan(clean!.high);
    expect(damaged!.totalDeductions).toBe(DEFAULT_DEDUCTION_AMOUNTS.exterior_damage_per_item * 2);
  });

  it("applies not-drivable deduction", () => {
    const clean = calculateOffer(makeBBVehicle(), makeFormData(), []);
    const notDrivable = calculateOffer(
      makeBBVehicle(),
      makeFormData({ drivable: "no" }),
      [],
    );
    expect(notDrivable!.high).toBeLessThan(clean!.high);
  });

  it("respects offer floor", () => {
    // Vehicle with massive deductions should still be >= floor (500)
    const result = calculateOffer(
      makeBBVehicle({ tradein: { clean: 1000, avg: 800, rough: 600 }, wholesale: { xclean: 900, clean: 800, avg: 700, rough: 500 }, retail: { xclean: 1200, clean: 1100, avg: 1000, rough: 800 } }),
      makeFormData({
        overallCondition: "fair",
        accidents: "3+",
        exteriorDamage: ["dent", "scratch", "rust", "paint"],
        interiorDamage: ["stain", "tear"],
        drivable: "no",
        smokedIn: "yes",
        numKeys: "0",
      }),
      [],
    );
    expect(result!.high).toBeGreaterThanOrEqual(500);
  });

  it("applies offer rules when criteria match", () => {
    const rules = [
      {
        id: "rule-1",
        rule_type: "bonus",
        criteria: { makes: ["Honda"] },
        adjustment_pct: 5,
        adjustment_type: "pct" as const,
        is_active: true,
        flag_in_dashboard: true,
      },
    ];
    const result = calculateOffer(makeBBVehicle(), makeFormData(), [], null, rules);
    expect(result!.matchedRuleIds).toContain("rule-1");
    expect(result!.isHotLead).toBe(true);
  });

  it("does not apply inactive rules", () => {
    const rules = [
      {
        id: "rule-inactive",
        rule_type: "bonus",
        criteria: { makes: ["Honda"] },
        adjustment_pct: 50,
        adjustment_type: "pct" as const,
        is_active: false,
        flag_in_dashboard: false,
      },
    ];
    const withRules = calculateOffer(makeBBVehicle(), makeFormData(), [], null, rules);
    const without = calculateOffer(makeBBVehicle(), makeFormData(), []);
    expect(withRules!.high).toBe(without!.high);
  });

  it("applies smoked-in deduction", () => {
    const clean = calculateOffer(makeBBVehicle(), makeFormData(), []);
    const smoked = calculateOffer(
      makeBBVehicle(),
      makeFormData({ smokedIn: "yes" }),
      [],
    );
    expect(smoked!.totalDeductions).toBeGreaterThan(clean!.totalDeductions);
  });

  it("applies missing keys deduction", () => {
    const twoKeys = calculateOffer(makeBBVehicle(), makeFormData(), []);
    const oneKey = calculateOffer(
      makeBBVehicle(),
      makeFormData({ numKeys: "1" }),
      [],
    );
    const noKeys = calculateOffer(
      makeBBVehicle(),
      makeFormData({ numKeys: "0" }),
      [],
    );
    expect(oneKey!.totalDeductions).toBeGreaterThan(twoKeys!.totalDeductions);
    expect(noKeys!.totalDeductions).toBeGreaterThan(oneKey!.totalDeductions);
  });
});
