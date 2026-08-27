import { describe, expect, it } from "vitest";
import { clamp, formatMoney, round } from "./money";
import { monthsBetween, toIsoDate } from "./dates";

describe("formatMoney", () => {
  it("formats whole AUD amounts", () => {
    expect(formatMoney(6000, "AUD")).toBe("$6,000");
    expect(formatMoney(1234.56, "AUD")).toBe("$1,235");
  });
  it("supports compact notation", () => {
    expect(formatMoney(120000, "AUD", { compact: true })).toBe("$120K");
  });
  it("falls back for an invalid currency code", () => {
    expect(formatMoney(10, "NOPE")).toBe("NOPE 10");
  });
});

describe("clamp / round", () => {
  it("clamps and rounds", () => {
    expect(clamp(7, 1, 5)).toBe(5);
    expect(clamp(-1, 1, 5)).toBe(1);
    expect(clamp(3, 1, 5)).toBe(3);
    expect(round(1.23456, 2)).toBe(1.23);
    expect(round(2.5)).toBe(3);
  });
});

describe("monthsBetween", () => {
  const now = new Date("2026-09-01T00:00:00Z");
  it("counts whole months and respects the day of month", () => {
    expect(monthsBetween(now, "2028-03-01")).toBe(18);
    expect(monthsBetween(now, "2026-10-15")).toBe(1);
    expect(monthsBetween(new Date("2026-09-15T00:00:00Z"), "2026-10-01")).toBe(0);
  });
  it("never goes negative and tolerates garbage", () => {
    expect(monthsBetween(now, "2020-01-01")).toBe(0);
    expect(monthsBetween(now, "not-a-date")).toBe(0);
  });
  it("formats ISO dates", () => {
    expect(toIsoDate(now)).toBe("2026-09-01");
  });
});
