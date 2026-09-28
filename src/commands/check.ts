import { rollPercentile } from "../dice.ts";
import { emit, modTag } from "../out.ts";
import { diceFor, resolveCheck, takeMod } from "../rules.ts";

const USAGE = "Usage: moshi check <target> [+|-] [--skill=N]   (e.g. moshi check 35 + --skill=10)";

const pad = (n: number): string => String(n).padStart(2, "0");

export function cmdCheck(args: string[]): void {
  const { mod, rest } = takeMod(args);
  const targetArg = rest.find((a) => !a.startsWith("-"));
  const base = parseInt(targetArg ?? "", 10);
  if (Number.isNaN(base)) throw new Error(USAGE);
  const skillArg = rest.find((a) => a.startsWith("--skill="));
  const skill = skillArg ? parseInt(skillArg.slice("--skill=".length), 10) || 0 : 0;
  const target = base + skill;

  const rolls = Array.from({ length: diceFor(mod) }, rollPercentile);
  const r = resolveCheck(target, rolls, mod);

  const verdict = `${r.critical ? "CRITICAL " : ""}${r.success ? "SUCCESS" : "FAILURE"}`;
  const shown = rolls.length > 1 ? ` (${rolls.map(pad).join(", ")})` : "";
  const lines = [`${pad(r.roll)}${shown} vs ${target}${modTag(mod)}: ${verdict}`];
  if (r.stress) lines.push(`Gain ${r.stress} Stress.`);
  if (r.panic) lines.push("Critical failure: make a Panic Check (moshi panic <stress>).");
  emit(args, { ...r, base, skill }, lines.join("\n"));
}
