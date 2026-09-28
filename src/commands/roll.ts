import { roll } from "../dice.ts";
import { emit, modTag } from "../out.ts";
import { takeMod } from "../rules.ts";

export function cmdRoll(args: string[]): void {
  const { mod, rest } = takeMod(args);
  const expr = rest.filter((a) => !a.startsWith("-")).join("") || "1d10";
  const results = mod === 0 ? [roll(expr)] : [roll(expr), roll(expr)];
  const totals = results.map((r) => r.total);
  const total = mod > 0 ? Math.max(...totals) : mod < 0 ? Math.min(...totals) : totals[0];

  const detail = results.map((r) => `[${r.rolls.join(", ")}] = ${r.total}`).join("  |  ");
  emit(args, { expr, mod, results, total }, `${expr}${modTag(mod)}: ${total}   ${detail}`);
}
