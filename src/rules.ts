export type Mod = -1 | 0 | 1;

export function takeMod(args: string[]): { mod: Mod; rest: string[] } {
  let net = 0;
  const rest: string[] = [];
  for (const a of args) {
    if (a === "+" || a === "[+]" || a === "--adv") net++;
    else if (a === "-" || a === "[-]" || a === "--dis") net--;
    else rest.push(a);
  }
  return { mod: Math.sign(net) as Mod, rest };
}

export function isDoubles(n: number): boolean {
  return Math.floor(n / 10) === n % 10;
}

export interface Outcome {
  roll: number;
  success: boolean;
  critical: boolean;
}

export function judge(roll: number, target: number): Outcome {
  const success = roll === 0 || (roll < target && roll < 90);
  return { roll, success, critical: isDoubles(roll) };
}

function rank(o: Outcome): number {
  if (o.success) return o.critical ? 3 : 2;
  return o.critical ? 0 : 1;
}

export interface CheckResult extends Outcome {
  target: number;
  mod: Mod;
  rolls: number[];
  panic: boolean;
  stress: number;
}

export function resolveCheck(target: number, rolls: number[], mod: Mod): CheckResult {
  const outcomes = rolls.map((r) => judge(r, target));
  let chosen = outcomes[0];
  for (const o of outcomes.slice(1)) {
    if (mod > 0 ? rank(o) > rank(chosen) : rank(o) < rank(chosen)) chosen = o;
  }
  return {
    ...chosen,
    target,
    mod,
    rolls,
    panic: chosen.critical && !chosen.success,
    stress: chosen.success ? 0 : 1,
  };
}

export interface PanicResult {
  stress: number;
  mod: Mod;
  rolls: number[];
  roll: number;
  passed: boolean;
}

export function resolvePanic(stress: number, rolls: number[], mod: Mod): PanicResult {
  const roll = mod > 0 ? Math.max(...rolls) : mod < 0 ? Math.min(...rolls) : rolls[0];
  return { stress, mod, rolls, roll, passed: roll > stress };
}

export function diceFor(mod: Mod): number {
  return mod === 0 ? 1 : 2;
}
