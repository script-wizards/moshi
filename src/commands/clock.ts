import { logEvent, withSession } from "../active.ts";
import { formatMinutes, parseDuration, resetClock, startClock, viewClock } from "../clock.ts";
import type { ClockView } from "../clock.ts";
import { emit } from "../out.ts";
import type { Session } from "../state.ts";

const USAGE = `Usage:
  moshi clock                              list clocks (due ones first)
  moshi clock add <name> <10m|2h> [--every] [--game]
                                           real time by default; --game counts game time
                                           --every restarts it each time you mark it done
  moshi clock done <name>                  handled it: restart (--every) or remove
  moshi clock rm <name>
  moshi clock pause | resume               stop real-time clocks during a break`;

export function viewClocks(s: Session, now = Date.now()): ClockView[] {
  return s.clocks
    .map((c) => viewClock(c, now, s.gameMinutes, s.pausedAt))
    .toSorted((a, b) => a.remaining - b.remaining);
}

export function renderClock(c: ClockView): string {
  const when = c.isDue
    ? `DUE (${formatMinutes(-c.remaining)} ago)`
    : `in ${formatMinutes(c.remaining)}`;
  const tags = [
    c.mode === "game" ? "game time" : "real time",
    c.every ? `every ${formatMinutes(c.every)}` : "",
  ]
    .filter(Boolean)
    .join(", ");
  return `  ${c.name.padEnd(24)} ${when.padEnd(20)} ${tags}`;
}

function find(s: Session, name: string): number {
  const q = name.toLowerCase();
  let i = s.clocks.findIndex((c) => c.name.toLowerCase() === q);
  if (i < 0) {
    const hits = s.clocks
      .map((c, j) => [c.name.toLowerCase(), j] as const)
      .filter(([n]) => n.includes(q));
    if (hits.length === 1) i = hits[0][1];
  }
  if (i < 0) throw new Error(`No clock "${name}". moshi clock`);
  return i;
}

export function cmdClock(args: string[]): void {
  const pos = args.filter((a) => !a.startsWith("-"));
  const [sub, ...rest] = pos;
  const now = Date.now();
  withSession((s) => {
    if (!sub) {
      const views = viewClocks(s, now);
      const paused = s.pausedAt ? "Real-time clocks PAUSED.\n" : "";
      emit(
        args,
        { paused: Boolean(s.pausedAt), clocks: views },
        paused + (views.map(renderClock).join("\n") || "No clocks."),
      );
      return;
    }
    if (sub === "add") {
      const dur = rest.at(-1);
      const name = rest.slice(0, -1).join(" ");
      if (!name || !dur) throw new Error(USAGE);
      const mode = args.includes("--game") ? "game" : "real";
      const clock = startClock(
        name,
        parseDuration(dur),
        mode,
        args.includes("--every"),
        s.pausedAt ?? now,
        s.gameMinutes,
      );
      s.clocks = s.clocks.filter((c) => c.name.toLowerCase() !== name.toLowerCase());
      s.clocks.push(clock);
      logEvent("clock", `added ${name} (${dur}${clock.every ? ", repeating" : ""}, ${mode} time)`);
      emit(args, clock, renderClock(viewClock(clock, now, s.gameMinutes, s.pausedAt)));
      return;
    }
    if (sub === "done" || sub === "rm") {
      const i = find(s, rest.join(" "));
      const c = s.clocks[i];
      const next = sub === "done" ? resetClock(c, s.pausedAt ?? now, s.gameMinutes) : null;
      if (next) s.clocks[i] = next;
      else s.clocks.splice(i, 1);
      logEvent("clock", `${sub === "done" ? "done" : "removed"}: ${c.name}`);
      const text = next
        ? `${c.name}: restarted\n${renderClock(viewClock(next, now, s.gameMinutes, s.pausedAt))}`
        : `${c.name}: removed`;
      emit(args, { clock: c.name, next }, text);
      return;
    }
    if (sub === "pause") {
      s.pausedAt ??= now;
      logEvent("clock", "paused real-time clocks");
      emit(args, { paused: true }, "Real-time clocks paused.");
      return;
    }
    if (sub === "resume") {
      if (s.pausedAt) {
        const shift = now - s.pausedAt;
        s.clocks = s.clocks.map((c) => (c.mode === "real" ? { ...c, due: c.due + shift } : c));
        s.pausedAt = undefined;
      }
      logEvent("clock", "resumed real-time clocks");
      emit(args, { paused: false }, "Real-time clocks running.");
      return;
    }
    throw new Error(USAGE);
  });
}
