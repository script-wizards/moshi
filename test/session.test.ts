import { expect, test } from "bun:test";
import { formatMinutes, parseDuration, resetClock, startClock, viewClock } from "../src/clock.ts";
import { applyFields } from "../src/fields.ts";
import { isFirstPartyText } from "../src/pdf/meta.ts";
import type { Fields } from "../src/state.ts";

test("durations", () => {
  expect(parseDuration("10m")).toBe(10);
  expect(parseDuration("10")).toBe(10);
  expect(parseDuration("2h")).toBe(120);
  expect(parseDuration("30s")).toBe(0.5);
  expect(() => parseDuration("soon")).toThrow();
  expect(formatMinutes(125)).toBe("2h05m");
  expect(formatMinutes(1.5)).toBe("1m30s");
  expect(formatMinutes(-0.25)).toBe("-15s");
});

test("real-time clocks count down and respect a pause", () => {
  const t0 = 1_000_000;
  const c = startClock("lights", 10, "real", true, t0, 0);
  expect(viewClock(c, t0 + 5 * 60000, 0).remaining).toBe(5);
  expect(viewClock(c, t0 + 11 * 60000, 0).isDue).toBe(true);
  expect(viewClock(c, t0 + 60 * 60000, 0, t0 + 2 * 60000).remaining).toBe(8);
});

test("game-time clocks follow game minutes; repeats restart from now", () => {
  const c = startClock("rot", 30, "game", false, 0, 100);
  expect(viewClock(c, 0, 120).remaining).toBe(10);
  expect(viewClock(c, 0, 131).isDue).toBe(true);
  expect(resetClock(c, 0, 131)).toBeNull();
  const r = startClock("patrol", 10, "real", true, 0, 0);
  expect(resetClock(r, 25 * 60000, 0)!.due).toBe(35 * 60000);
});

test("field assignments", () => {
  const f: Fields = { stress: 2 };
  expect(applyFields(f, ["stress+=3", "health=12", "status=gone", "wounds-=1"])).toEqual([
    "stress=5",
    "health=12",
    "status=gone",
    "wounds=-1",
  ]);
  expect(f).toEqual({ stress: 5, health: 12, status: "gone", wounds: -1 });
  expect(() => applyFields(f, ["stress+=lots"])).toThrow();
  expect(() => applyFields(f, ["nonsense"])).toThrow();
});

test("first-party detection", () => {
  expect(isFirstPartyText("Tuesday Knight Games", "")).toBe(true);
  expect(isFirstPartyText("", "Copyright © 2030 Tuesday Knight Games")).toBe(true);
  expect(isFirstPartyText("", "blah MRPG-Z9 blah")).toBe(true);
  expect(
    isFirstPartyText("Someone Else", "compatible with Mothership by Tuesday Knight Games"),
  ).toBe(false);
});
