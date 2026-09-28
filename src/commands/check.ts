import { logEvent, withSession } from "../active.ts";
import { rollPercentile } from "../dice.ts";
import { emit, modTag } from "../out.ts";
import { diceFor, resolveCheck, takeMod } from "../rules.ts";
import { resolveCastName } from "./cast.ts";

const USAGE = `Usage: moshi check <target | stat> [+|-] [--skill=N] [--who=name]
  moshi check 35 +               plain target at advantage
  moshi check strength --who=Ana  target from Ana's tracked stats; a failure adds her Stress`;

const pad = (n: number): string => String(n).padStart(2, "0");

export function cmdCheck(args: string[]): void {
  const { mod, rest } = takeMod(args);
  const targetArg = rest.find((a) => !a.startsWith("-"));
  if (!targetArg) throw new Error(USAGE);
  const who = rest.find((a) => a.startsWith("--who="))?.slice(6);
  const skillArg = rest.find((a) => a.startsWith("--skill="));
  const skill = skillArg ? parseInt(skillArg.slice(8), 10) || 0 : 0;

  const run = (fields?: Record<string, string | number>, name?: string): void => {
    let base = parseInt(targetArg, 10);
    let label = String(base);
    if (Number.isNaN(base)) {
      const v = fields?.[targetArg.toLowerCase()];
      if (v === undefined) throw new Error(who ? `${name} has no "${targetArg}" tracked.` : USAGE);
      base = Number(v);
      label = `${targetArg} ${base}`;
    }
    const target = base + skill;
    const rolls = Array.from({ length: diceFor(mod) }, rollPercentile);
    const r = resolveCheck(target, rolls, mod);

    const verdict = `${r.critical ? "CRITICAL " : ""}${r.success ? "SUCCESS" : "FAILURE"}`;
    const shown = rolls.length > 1 ? ` (${rolls.map(pad).join(", ")})` : "";
    const vs = skill ? `${label}+${skill}` : label;
    const lines = [
      `${name ? `${name}: ` : ""}${pad(r.roll)}${shown} vs ${vs}${modTag(mod)}: ${verdict}`,
    ];
    if (r.stress) {
      if (fields) {
        fields.stress = Number(fields.stress ?? 0) + r.stress;
        lines.push(`${name} gains ${r.stress} Stress (now ${fields.stress}).`);
      } else lines.push(`Gain ${r.stress} Stress.`);
    }
    if (r.panic)
      lines.push(`Critical failure: make a Panic Check (moshi panic ${name ?? "<stress>"}).`);
    logEvent("check", lines.join(" "));
    emit(
      args,
      { ...r, base, skill, who: name ?? null, stressNow: fields?.stress ?? null },
      lines.join("\n"),
    );
  };

  if (!who) return run();
  withSession((s) => {
    const name = resolveCastName(s.cast, who);
    run(s.cast[name], name);
  });
}
