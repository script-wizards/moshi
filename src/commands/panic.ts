import { logEvent, withSession } from "../active.ts";
import { panicTable } from "../core.ts";
import { rollDie } from "../dice.ts";
import { emit, modTag } from "../out.ts";
import { diceFor, resolvePanic, takeMod } from "../rules.ts";
import { resolveCastName } from "./cast.ts";

const USAGE = "Usage: moshi panic <stress | cast name> [+|-]";

export function cmdPanic(args: string[]): void {
  const { mod, rest } = takeMod(args);
  const arg = rest.find((a) => !a.startsWith("-"));
  if (!arg) throw new Error(USAGE);

  const run = (stress: number, name?: string): void => {
    const rolls = Array.from({ length: diceFor(mod) }, () => rollDie(20));
    const r = resolvePanic(stress, rolls, mod);
    const entry = r.passed ? null : (panicTable().find((e) => e.n === r.roll) ?? null);

    const shown = rolls.length > 1 ? ` (${rolls.join(", ")})` : "";
    const head = `${name ? `${name}: ` : ""}d20 ${r.roll}${shown} vs Stress ${stress}${modTag(mod)}`;
    const text = r.passed
      ? `${head}: HOLDS IT TOGETHER`
      : `${head}: PANIC\n${entry ? `${r.roll}. ${entry.text}` : `Look up ${r.roll} on the Panic Table.`}`;
    logEvent("panic", text.replace(/\n/g, " "));
    emit(args, { ...r, who: name ?? null, entry }, text);
  };

  const n = parseInt(arg, 10);
  if (!Number.isNaN(n)) return run(n);
  withSession((s) => {
    const name = resolveCastName(s.cast, arg);
    run(Number(s.cast[name].stress ?? 0), name);
  });
}
