import { extractPanels } from "./pdf/extract.ts";
import type { Item, Section } from "./parse/sections.ts";
import { parseItems, parseSections, slug } from "./parse/sections.ts";
import type { Session } from "./state.ts";
import { appendLog, loadSession, loadState, saveSession } from "./state.ts";

export function activeModule(): { id: string; path: string } {
  const m = loadState().module;
  if (!m) throw new Error("No active module. Run: moshi use <module>");
  return m;
}

export function moduleSections(path: string): Section[] {
  return parseSections(extractPanels(path));
}

export interface Found {
  section: Section;
  item?: Item;
}

export function findSection(sections: Section[], query: string): Found {
  const q = query.trim().toLowerCase();
  const sub = q.match(/^(\d+)-(\d+)$/);
  if (sub) {
    const section = sections.find((s) => s.kind === "location" && s.key === sub[1]);
    const item = section && parseItems(section.body).find((i) => i.n === parseInt(sub[2], 10));
    if (section && item) return { section, item };
    throw new Error(`No item ${sub[2]} in location ${sub[1]}.`);
  }
  if (/^\d+$/.test(q)) {
    const section = sections.find((s) => s.kind === "location" && s.key === q);
    if (section) return { section };
    throw new Error(`No location ${q}. Try: moshi show`);
  }
  const exact = sections.find((s) => s.id === q || slug(s.title) === slug(q));
  if (exact) return { section: exact };
  const words = slug(q).split("-").filter(Boolean);
  const hits = sections.filter((s) => {
    const hay = `${s.id} ${slug(s.title)}`;
    return words.every((w) => hay.includes(w));
  });
  if (hits.length === 1) return { section: hits[0] };
  if (hits.length === 0)
    throw new Error(`Nothing titled "${query}". Try: moshi show, or moshi search "${query}"`);
  throw new Error(
    `"${query}" matches several:\n${hits.map((s) => `  ${s.id.padEnd(24)} ${s.title}`).join("\n")}`,
  );
}

export function withSession<T>(fn: (session: Session, moduleId: string) => T): T {
  const { id } = activeModule();
  const session = loadSession(id);
  const out = fn(session, id);
  saveSession(id, session);
  return out;
}

export function logEvent(kind: string, text: string): void {
  const m = loadState().module;
  if (!m) return;
  const game = loadSession(m.id).gameMinutes;
  appendLog(m.id, { at: new Date().toISOString(), game, kind, text });
}
