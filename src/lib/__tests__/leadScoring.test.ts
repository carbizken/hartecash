import { describe, it, expect } from "vitest";
import { calculateLeadScore, getScoreColor } from "../leadScoring";

describe("calculateLeadScore", () => {
  it("scores a highly engaged submission as Hot", () => {
    const result = calculateLeadScore({
      vin: "1HGCG5654WA043112",
      photos_uploaded: true,
      docs_uploaded: true,
      appointment_set: true,
      mileage: "45000",
      overall_condition: "excellent",
      offered_price: 22000,
      phone: "5551234567",
      email: "test@example.com",
      lead_source: "service",
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe("Hot");
  });

  it("scores a minimal submission as Cold", () => {
    const result = calculateLeadScore({
      progress_status: "partial",
    });
    // No positive signals, negative: partial form, no phone, no email
    expect(result.score).toBe(0); // -15 + -10 + -8 = -33, clamped to 0
    expect(result.label).toBe("Cold");
  });

  it("clamps score between 0 and 100", () => {
    // Dead lead should not go below 0
    const deadLead = calculateLeadScore({
      progress_status: "dead_lead",
    });
    expect(deadLead.score).toBe(0);
    expect(deadLead.score).toBeGreaterThanOrEqual(0);
  });

  it("applies VIN bonus", () => {
    const withVin = calculateLeadScore({
      vin: "ABC123",
      phone: "555",
      email: "a@b.com",
    });
    const withoutVin = calculateLeadScore({
      phone: "555",
      email: "a@b.com",
    });
    expect(withVin.score).toBeGreaterThan(withoutVin.score);
  });

  it("penalizes missing phone and email", () => {
    const withContact = calculateLeadScore({
      vin: "ABC",
      phone: "555",
      email: "a@b.com",
    });
    const withoutContact = calculateLeadScore({
      vin: "ABC",
    });
    // withContact has vin(15), withoutContact has vin(15) + no phone(-10) + no email(-8)
    expect(withoutContact.score).toBeLessThan(withContact.score);
  });

  it("applies low mileage bonus for < 80k", () => {
    const lowMileage = calculateLeadScore({
      mileage: "45000",
      phone: "555",
      email: "a@b.com",
    });
    const highMileage = calculateLeadScore({
      mileage: "120000",
      phone: "555",
      email: "a@b.com",
    });
    expect(lowMileage.score).toBeGreaterThan(highMileage.score);
  });

  it("parses mileage strings with commas", () => {
    const result = calculateLeadScore({
      mileage: "45,000",
      phone: "555",
      email: "a@b.com",
    });
    expect(result.score).toBeGreaterThan(0);
  });

  it("applies condition bonuses and penalties", () => {
    const excellent = calculateLeadScore({
      overall_condition: "excellent",
      phone: "555",
      email: "a@b.com",
    });
    const poor = calculateLeadScore({
      overall_condition: "poor",
      phone: "555",
      email: "a@b.com",
    });
    expect(excellent.score).toBeGreaterThan(poor.score);
  });

  it("returns top 3 factors sorted by magnitude", () => {
    const result = calculateLeadScore({
      vin: "ABC123",
      photos_uploaded: true,
      appointment_set: true,
      phone: "555",
      email: "a@b.com",
    });
    expect(result.factors.length).toBeLessThanOrEqual(3);
  });

  it("detects hot leads", () => {
    const result = calculateLeadScore({
      is_hot_lead: true,
      phone: "555",
      email: "a@b.com",
    });
    expect(result.score).toBeGreaterThan(0);
  });

  it("penalizes stale leads (>7 days old, no activity)", () => {
    const stale = calculateLeadScore({
      vin: "ABC",
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      phone: "555",
      email: "a@b.com",
    });
    const fresh = calculateLeadScore({
      vin: "ABC",
      created_at: new Date().toISOString(),
      phone: "555",
      email: "a@b.com",
    });
    expect(stale.score).toBeLessThan(fresh.score);
  });
});

describe("getScoreColor", () => {
  it("returns hot color for score >= 80", () => {
    expect(getScoreColor(80)).toContain("orange");
    expect(getScoreColor(100)).toContain("orange");
  });

  it("returns warm color for score >= 60", () => {
    expect(getScoreColor(60)).toContain("amber");
    expect(getScoreColor(79)).toContain("amber");
  });

  it("returns lukewarm color for score >= 40", () => {
    expect(getScoreColor(40)).toContain("blue");
    expect(getScoreColor(59)).toContain("blue");
  });

  it("returns cold color for score < 40", () => {
    expect(getScoreColor(0)).toContain("muted");
    expect(getScoreColor(39)).toContain("muted");
  });
});
