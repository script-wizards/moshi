import { rollDie } from "../dice.ts";
import { emit, modTag } from "../out.ts";
import { diceFor, resolvePanic, takeMod } from "../rules.ts";

const USAGE = "Usage: moshi panic <current stress> [+|-]";

export function cmdPanic(args: string[]): void {
  const { mod, rest } = takeMod(args);
  const stressArg = rest.find((a) => !a.startsWith("-"));
  const stress = parseInt(stressArg ?? "", 10);
  if (Number.isNaN(stress)) throw new Error(USAGE);

  const rolls = Array.from({ length: diceFor(mod) }, () => rollDie(20));
  const r = resolvePanic(stress, rolls, mod);

  const shown = rolls.length > 1 ? ` (${rolls.join(", ")})` : "";
  const head = `d20 ${r.roll}${shown} vs Stress ${stress}${modTag(mod)}`;
  const text = r.passed
    ? `${head}: HOLDS IT TOGETHER`
    : `${head}: PANIC. Look up ${r.roll} on the Panic Table.`;
  emit(args, { ...r, tableEntry: r.passed ? null : r.roll }, text);
}
