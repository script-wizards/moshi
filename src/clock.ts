import type { Clock } from "./state.ts";

export function parseDuration(s: string): number {
  const m = s.trim().match(/^(\d+(?:\.\d+)?)\s*(s|m|min|h|hr|d)?$/i);
  if (!m) throw new Error(`Can't read duration "${s}" (try 10m, 2h, 30s)`);
  const n = parseFloat(m[1]);
  const unit = (m[2] ?? "m").toLowerCase();
  if (unit === "s") return n / 60;
  if (unit === "h" || unit === "hr") return n * 60;
  if (unit === "d") return n * 1440;
  return n;
}

export function formatMinutes(min: number): string {
  const neg = min < 0;
  let s = Math.round(Math.abs(min) * 60);
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  s -= m * 60;
  const out = h
    ? `${h}h${String(m).padStart(2, "0")}m`
    : m
      ? `${m}m${String(s).padStart(2, "0")}s`
      : `${s}s`;
  return neg ? `-${out}` : out;
}

export interface ClockView extends Clock {
  remaining: number;
  isDue: boolean;
}

export function viewClock(
  c: Clock,
  nowMs: number,
  gameMinutes: number,
  pausedAt?: number,
): ClockView {
  const remaining = c.mode === "real" ? (c.due - (pausedAt ?? nowMs)) / 60000 : c.due - gameMinutes;
  return { ...c, remaining, isDue: remaining <= 0 };
}

export function startClock(
  name: string,
  minutes: number,
  mode: Clock["mode"],
  repeat: boolean,
  nowMs: number,
  gameMinutes: number,
): Clock {
  const due = mode === "real" ? nowMs + minutes * 60000 : gameMinutes + minutes;
  return repeat ? { name, mode, due, every: minutes } : { name, mode, due };
}

// A repeating clock restarts from now, not from when it was due, so a late
// check never fires twice in a row.
export function resetClock(c: Clock, nowMs: number, gameMinutes: number): Clock | null {
  if (!c.every) return null;
  return { ...c, due: c.mode === "real" ? nowMs + c.every * 60000 : gameMinutes + c.every };
}
