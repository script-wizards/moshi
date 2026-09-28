import { expect, test } from "bun:test";
import { isDoubles, judge, resolveCheck, resolvePanic, takeMod } from "../src/rules.ts";

test("doubles", () => {
  for (const n of [0, 11, 22, 55, 99]) expect(isDoubles(n)).toBe(true);
  for (const n of [1, 10, 12, 90, 98]) expect(isDoubles(n)).toBe(false);
});

test("roll under the target succeeds; meeting it fails", () => {
  expect(judge(44, 45).success).toBe(true);
  expect(judge(45, 45).success).toBe(false);
  expect(judge(46, 45).success).toBe(false);
});

test("90-99 always fail, 00 always succeeds", () => {
  for (let r = 90; r <= 99; r++) expect(judge(r, 120).success).toBe(false);
  expect(judge(0, 0).success).toBe(true);
  expect(judge(0, 0).critical).toBe(true);
  expect(judge(99, 120).critical).toBe(true);
});

test("critical failure forces a panic check and costs stress", () => {
  const r = resolveCheck(30, [77], 0);
  expect(r.success).toBe(false);
  expect(r.critical).toBe(true);
  expect(r.panic).toBe(true);
  expect(r.stress).toBe(1);
});

test("critical success is not a panic", () => {
  const r = resolveCheck(30, [22], 0);
  expect(r.success && r.critical).toBe(true);
  expect(r.panic).toBe(false);
  expect(r.stress).toBe(0);
});

test("advantage keeps the better outcome, disadvantage the worse", () => {
  // 50 fails, 12 succeeds against 40.
  expect(resolveCheck(40, [50, 12], 1).roll).toBe(12);
  expect(resolveCheck(40, [50, 12], -1).roll).toBe(50);
  // A critical success outranks a plain success.
  expect(resolveCheck(40, [13, 33], 1).roll).toBe(33);
  // A critical failure is worse than a plain failure.
  expect(resolveCheck(40, [51, 66], -1).roll).toBe(66);
});

test("mod tokens, including cancellation", () => {
  expect(takeMod(["35", "+"])).toEqual({ mod: 1, rest: ["35"] });
  expect(takeMod(["[-]", "35"])).toEqual({ mod: -1, rest: ["35"] });
  expect(takeMod(["--adv", "35", "--dis"])).toEqual({ mod: 0, rest: ["35"] });
  expect(takeMod(["35", "--skill=10"]).rest).toEqual(["35", "--skill=10"]);
});

test("panic check passes only above current stress", () => {
  expect(resolvePanic(5, [6], 0).passed).toBe(true);
  expect(resolvePanic(5, [5], 0).passed).toBe(false);
  expect(resolvePanic(5, [2, 9], 1)).toMatchObject({ roll: 9, passed: true });
  expect(resolvePanic(5, [2, 9], -1)).toMatchObject({ roll: 2, passed: false });
});
