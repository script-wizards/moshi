import type { Fields } from "./state.ts";

export function applyFields(target: Fields, assignments: string[]): string[] {
  const changes: string[] = [];
  for (const a of assignments) {
    const m = a.match(/^([^=+-]+?)(\+=|-=|=)(.*)$/);
    if (!m) throw new Error(`Can't read "${a}" (use key=value, key+=N, key-=N)`);
    const [, rawKey, op, raw] = m;
    const key = rawKey.trim().toLowerCase();
    const num = Number(raw);
    if (op === "=") {
      target[key] = raw !== "" && !Number.isNaN(num) ? num : raw;
    } else {
      if (Number.isNaN(num)) throw new Error(`"${a}" needs a number`);
      const cur = Number(target[key] ?? 0);
      target[key] = op === "+=" ? cur + num : cur - num;
    }
    changes.push(`${key}=${target[key]}`);
  }
  return changes;
}

export function formatFields(f: Fields): string {
  return Object.entries(f)
    .map(([k, v]) => `${k}=${v}`)
    .join("  ");
}
