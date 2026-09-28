import { activeModule, findSection, moduleSections } from "../active.ts";
import { emit } from "../out.ts";
import type { Section } from "../parse/sections.ts";
import { parseItems, parseStats } from "../parse/sections.ts";

function heading(s: Section): string {
  return s.kind === "location" ? `[${s.key}] ${s.title}` : s.title;
}

export function renderSection(s: Section): string {
  return `${heading(s)}   (p${s.page})\n${s.body}`;
}

function toc(sections: Section[]): string {
  const rows = sections.map((s) => `  ${s.id.padEnd(28)} ${s.kind.padEnd(9)} ${s.title}`);
  return `${rows.join("\n")}\n\nmoshi show <id | location number | 3-1 | words from a title>`;
}

export function cmdShow(args: string[]): void {
  const query = args.filter((a) => !a.startsWith("-")).join(" ");
  const sections = moduleSections(activeModule().path);
  if (!query) {
    const list = sections.map(({ id, kind, key, title, page }) => ({ id, kind, key, title, page }));
    emit(args, list, toc(sections));
    return;
  }
  const { section, item } = findSection(sections, query);
  const data = {
    ...section,
    items: parseItems(section.body),
    stats: parseStats(section.body),
    item: item ?? null,
  };
  const text = item ? `${heading(section)} / ${item.n}. ${item.text}` : renderSection(section);
  emit(args, data, text);
}

export function cmdRead(args: string[]): void {
  const sections = moduleSections(activeModule().path);
  emit(args, sections, sections.map(renderSection).join("\n\n---\n\n"));
}
