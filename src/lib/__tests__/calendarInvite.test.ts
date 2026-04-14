import { describe, it, expect } from "vitest";
import { generateICalEvent, generateGoogleCalendarUrl } from "../calendarInvite";

describe("generateICalEvent", () => {
  const baseParams = {
    summary: "Vehicle Drop-off",
    description: "Bring your 2022 Honda Civic for appraisal",
    location: "123 Main St, Hartford, CT 06001",
    startDate: new Date("2025-06-15T14:00:00Z"),
    endDate: new Date("2025-06-15T15:00:00Z"),
    organizerName: "Harte Auto",
    organizerEmail: "appraisals@harte.com",
  };

  it("produces valid iCalendar format", () => {
    const ics = generateICalEvent(baseParams);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("VERSION:2.0");
  });

  it("includes correct date formatting", () => {
    const ics = generateICalEvent(baseParams);
    expect(ics).toContain("DTSTART:20250615T140000Z");
    expect(ics).toContain("DTEND:20250615T150000Z");
  });

  it("escapes special characters in text", () => {
    const ics = generateICalEvent({
      ...baseParams,
      summary: "Drop-off; Appraisal, Free",
      description: "Line 1\nLine 2",
    });
    expect(ics).toContain("SUMMARY:Drop-off\\; Appraisal\\, Free");
    expect(ics).toContain("DESCRIPTION:Line 1\\nLine 2");
  });

  it("includes organizer info", () => {
    const ics = generateICalEvent(baseParams);
    expect(ics).toContain("ORGANIZER");
    expect(ics).toContain("mailto:appraisals@harte.com");
  });
});

describe("generateGoogleCalendarUrl", () => {
  it("generates a valid Google Calendar URL", () => {
    const url = generateGoogleCalendarUrl({
      title: "Vehicle Drop-off",
      description: "Bring your car",
      location: "123 Main St",
      startDate: new Date("2025-06-15T14:00:00Z"),
      endDate: new Date("2025-06-15T15:00:00Z"),
    });
    expect(url).toContain("calendar.google.com/calendar/render");
    expect(url).toContain("action=TEMPLATE");
    expect(url).toContain("text=Vehicle+Drop-off");
    expect(url).toContain("20250615T140000Z");
  });
});
