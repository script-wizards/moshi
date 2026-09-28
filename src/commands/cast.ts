import { logEvent, withSession } from "../active.ts";
import { applyFields, formatFields } from "../fields.ts";
import { emit } from "../out.ts";

const USAGE = `Usage:
  moshi cast                          list everyone tracked
  moshi cast add <name> [k=v ...]     start tracking someone
  moshi cast set <name> k=v k+=N ...  change fields (stress+=1, status=dead)
  moshi cast rm <name>
  moshi cast <name>                   show one`;

function findName(cast: Record<string, unknown>, name: string): string {
  const q = name.toLowerCase();
  const exact = Object.keys(cast).find((k) => k.toLowerCase() === q);
  if (exact) return exact;
  const hits = Object.keys(cast).filter((k) => k.toLowerCase().includes(q));
  if (hits.length === 1) return hits[0];
  throw new Error(
    hits.length ? `"${name}" matches ${hits.join(", ")}` : `No one named "${name}" in the cast.`,
  );
}

export function resolveCastName(cast: Record<string, unknown>, name: string): string {
  return findName(cast, name);
}

export function cmdCast(args: string[]): void {
  const pos = args.filter((a) => !a.startsWith("--") && a !== "-j");
  const [sub, name, ...rest] = pos;
  withSession((s) => {
    if (!sub) {
      const text = Object.entries(s.cast)
        .map(([n, f]) => `  ${n.padEnd(16)} ${formatFields(f)}`)
        .join("\n");
      emit(args, s.cast, text || "No one tracked yet. moshi cast add <name> [k=v ...]");
      return;
    }
    if (sub === "add") {
      if (!name) throw new Error(USAGE);
      if (s.cast[name]) throw new Error(`${name} is already tracked; use moshi cast set.`);
      s.cast[name] = {};
      const changes = applyFields(s.cast[name], rest);
      logEvent("cast", `added ${name} ${changes.join(" ")}`.trim());
      emit(args, { [name]: s.cast[name] }, `${name}  ${formatFields(s.cast[name])}`);
      return;
    }
    if (sub === "set") {
      if (!name || rest.length === 0) throw new Error(USAGE);
      const key = findName(s.cast, name);
      const changes = applyFields(s.cast[key], rest);
      logEvent("cast", `${key} ${changes.join(" ")}`);
      emit(args, { [key]: s.cast[key] }, `${key}  ${formatFields(s.cast[key])}`);
      return;
    }
    if (sub === "rm") {
      if (!name) throw new Error(USAGE);
      const key = findName(s.cast, name);
      delete s.cast[key];
      logEvent("cast", `removed ${key}`);
      emit(args, { removed: key }, `Removed ${key}`);
      return;
    }
    if (sub === "help") throw new Error(USAGE);
    const key = findName(s.cast, sub);
    emit(args, { [key]: s.cast[key] }, `${key}  ${formatFields(s.cast[key])}`);
  });
}
