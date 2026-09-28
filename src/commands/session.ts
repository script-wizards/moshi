import { activeModule, findSection, logEvent, moduleSections, withSession } from "../active.ts";
import { formatMinutes, parseDuration } from "../clock.ts";
import { formatFields } from "../fields.ts";
import { emit, localTime } from "../out.ts";
import { archiveSession, loadSession, readLog, saveSession, newSession } from "../state.ts";
import { renderClock, viewClocks } from "./clock.ts";
import { renderSection } from "./show.ts";

export function cmdStatus(args: string[]): void {
  const mod = activeModule();
  const s = loadSession(mod.id);
  const clocks = viewClocks(s);
  const log = readLog(mod.id).slice(-8);
  const lines = [
    `Module    ${mod.id}`,
    `Location  ${s.location ?? "(not set)"}`,
    `Game time ${formatMinutes(s.gameMinutes)} since start`,
    "",
    `Clocks${s.pausedAt ? " (real time PAUSED)" : ""}`,
    ...(clocks.length ? clocks.map(renderClock) : ["  none"]),
    "",
    "Cast",
    ...(Object.keys(s.cast).length
      ? Object.entries(s.cast).map(([n, f]) => `  ${n.padEnd(16)} ${formatFields(f)}`)
      : ["  none"]),
    "",
    "Flags",
    `  ${
      Object.entries(s.flags)
        .map(([k, v]) => `${k}=${v}`)
        .join("  ") || "none"
    }`,
    "",
    "Recent",
    ...(log.length
      ? log.map((e) => `  ${localTime(e.at)} ${e.kind.padEnd(6)} ${e.text}`)
      : ["  nothing yet"]),
  ];
  emit(args, { module: mod, session: s, clocks, recent: log }, lines.join("\n"));
}

export function cmdAt(args: string[]): void {
  const query = args.filter((a) => !a.startsWith("-")).join(" ");
  if (!query) throw new Error("Usage: moshi at <location number or name>");
  const { section } = findSection(moduleSections(activeModule().path), query);
  const label = section.kind === "location" ? `[${section.key}] ${section.title}` : section.title;
  withSession((s) => {
    s.location = label;
  });
  logEvent("at", label);
  emit(
    args,
    { location: label, section },
    args.includes("--quiet") ? label : renderSection(section),
  );
}

export function cmdFlag(args: string[]): void {
  const pos = args.filter((a) => !a.startsWith("-"));
  withSession((s) => {
    if (pos[0] === "rm") {
      for (const k of pos.slice(1)) delete s.flags[k.toLowerCase()];
      logEvent("flag", `removed ${pos.slice(1).join(" ")}`);
    } else {
      for (const a of pos) {
        const m = a.match(/^([^=]+)=(.*)$/);
        if (!m) throw new Error(`Can't read "${a}" (use key=value, or moshi flag rm key)`);
        s.flags[m[1].trim().toLowerCase()] = m[2];
      }
      if (pos.length) logEvent("flag", pos.join(" "));
    }
    const text =
      Object.entries(s.flags)
        .map(([k, v]) => `  ${k}=${v}`)
        .join("\n") || "No flags.";
    emit(args, s.flags, text);
  });
}

export function cmdTime(args: string[]): void {
  const step = args.find((a) => !a.startsWith("-"));
  withSession((s) => {
    if (step) {
      const minutes = parseDuration(step.replace(/^\+/, ""));
      s.gameMinutes += minutes;
      logEvent("time", `+${formatMinutes(minutes)} (now ${formatMinutes(s.gameMinutes)})`);
    }
    const due = viewClocks(s).filter((c) => c.mode === "game" && c.isDue);
    const text = [
      `Game time ${formatMinutes(s.gameMinutes)} since start`,
      ...due.map(renderClock),
    ].join("\n");
    emit(args, { gameMinutes: s.gameMinutes, due }, text);
  });
}

export function cmdLog(args: string[]): void {
  const { id } = activeModule();
  const pos = args.filter((a) => !a.startsWith("-"));
  if (pos.length) {
    logEvent("note", pos.join(" "));
    emit(args, { logged: pos.join(" ") }, "Logged.");
    return;
  }
  const nArg = args.find((a) => a.startsWith("--n="));
  const entries = readLog(id);
  const shown = args.includes("--all")
    ? entries
    : entries.slice(-(nArg ? parseInt(nArg.slice(4), 10) : 30));
  const text = shown
    .map((e) => `${localTime(e.at, true)}  ${e.kind.padEnd(6)} ${e.text}`)
    .join("\n");
  emit(args, shown, text || "Log is empty.");
}

export function cmdSession(args: string[]): void {
  const { id } = activeModule();
  if (args.find((a) => !a.startsWith("-")) === "new") {
    const archived = archiveSession(id);
    saveSession(id, newSession());
    logEvent("session", "started");
    emit(
      args,
      { archived },
      `New session for ${id}.${archived ? `\nPrevious one archived: ${archived}` : ""}`,
    );
    return;
  }
  const s = loadSession(id);
  emit(
    args,
    s,
    `Session for ${id}, started ${s.started}. moshi status for details; moshi session new to start over.`,
  );
}
