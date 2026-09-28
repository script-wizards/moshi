import { expect, test } from "bun:test";
import { roll, rollPercentile } from "../src/dice.ts";

test("constant expression", () => {
  expect(roll("4").total).toBe(4);
  expect(roll("4").rolls.length).toBe(0);
});

test("dice stay within range", () => {
  for (let i = 0; i < 500; i++) {
    const r = roll("2d10");
    expect(r.rolls.length).toBe(2);
    expect(r.total).toBeGreaterThanOrEqual(2);
    expect(r.total).toBeLessThanOrEqual(20);
  }
});

test("flat modifier is applied", () => {
  for (let i = 0; i < 100; i++) {
    const r = roll("1d5+10");
    expect(r.total).toBeGreaterThanOrEqual(11);
    expect(r.total).toBeLessThanOrEqual(15);
  }
});

test("percentile reads 00 to 99", () => {
  const seen = new Set<number>();
  for (let i = 0; i < 5000; i++) {
    const r = rollPercentile();
    expect(Number.isInteger(r)).toBe(true);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(99);
    seen.add(r);
  }
  expect(seen.has(0)).toBe(true);
  expect(seen.has(99)).toBe(true);
});

test("unparseable expression throws", () => {
  expect(() => roll("banana")).toThrow();
});
