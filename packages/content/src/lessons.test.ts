import { describe, expect, it } from "vitest";
import { lessons } from "./index";

/** Product names, providers and advice phrasing that must never appear in lesson bodies. */
const BANNED_STRINGS = [
  "you should buy",
  "you should invest in",
  "guaranteed",
  "vanguard",
  "betashares",
  "commsec",
  "coinbase",
  "binance",
];

/** "bitcoin " followed (anywhere later) by "price target". */
const BITCOIN_PRICE_TARGET = /bitcoin [\s\S]*price target/i;

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

describe("lesson catalogue", () => {
  it("contains exactly 10 lessons", () => {
    expect(lessons).toHaveLength(10);
  });

  it("has unique ids", () => {
    const ids = lessons.map((lesson) => lesson.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses kebab-case ids", () => {
    for (const lesson of lessons) {
      expect(lesson.id, `id "${lesson.id}" is not kebab-case`).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("keeps every body between 250 and 600 words", () => {
    for (const lesson of lessons) {
      const count = wordCount(lesson.body);
      expect(count, `${lesson.id} has ${count} words`).toBeGreaterThanOrEqual(250);
      expect(count, `${lesson.id} has ${count} words`).toBeLessThanOrEqual(600);
    }
  });

  it("gives every lesson exactly 3 quick-check items", () => {
    for (const lesson of lessons) {
      expect(lesson.quickCheck, `${lesson.id} quickCheck`).toHaveLength(3);
    }
  });

  it("never names products or gives buy/sell advice", () => {
    for (const lesson of lessons) {
      const body = lesson.body.toLowerCase();
      for (const banned of BANNED_STRINGS) {
        expect(body, `${lesson.id} contains "${banned}"`).not.toContain(banned);
      }
      expect(lesson.body, `${lesson.id} contains a bitcoin price target`).not.toMatch(BITCOIN_PRICE_TARGET);
    }
  });
});
