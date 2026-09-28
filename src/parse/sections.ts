export type SectionKind = "location" | "section" | "callout";

export interface Section {
  id: string;
  kind: SectionKind;
  key?: string;
  title: string;
  page: number;
  panel: number;
  body: string;
}

export interface PanelText {
  page: number;
  panel: number;
  text: string;
}

const LOCATION = /^(\d{1,3})\s+([A-Z][A-Z0-9 '’&.\-/]*[A-Z0-9])$/;
const CALLOUT_KEY = /^(.*\S)\s{6,}(\d{1,2})$/;

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isCaps(line: string): boolean {
  return /[A-Z]{2}/.test(line) && !/[a-z:]/.test(line) && line.length <= 48;
}

function stripMarks(line: string): string {
  return line.replace(/^!+\s*|\s*!+$/g, "").trim();
}

const indent = (l: string): number => l.match(/^ */)![0].length;

// Trailing lines indented far past the body are page furniture (credits,
// product codes), not part of the section.
function dedent(lines: string[]): string {
  const indents = lines.filter((l) => l.trim()).map(indent);
  const cut = indents.length ? Math.min(...indents) : 0;
  let end = lines.length;
  while (end > 0 && (!lines[end - 1].trim() || indent(lines[end - 1]) >= cut + 20)) end--;
  return lines
    .slice(0, end)
    .map((l) => l.slice(cut).trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Text before a panel's first heading: paragraphs that end in a keyed number
// (a big "1", "2" in the margin) become callouts, titled by their first line.
function callouts(lines: string[], page: number, panel: number): Section[] {
  const out: Section[] = [];
  const paras: string[][] = [[]];
  for (const l of lines) {
    if (l.trim()) paras.at(-1)!.push(l);
    else if (paras.at(-1)!.length) paras.push([]);
  }
  let current: Section | null = null;
  for (const para of paras) {
    const keyLine = para.findIndex((l) => CALLOUT_KEY.test(l.trim()));
    if (keyLine >= 0) {
      const m = para[keyLine].trim().match(CALLOUT_KEY)!;
      const lines2 = para.map((l, i) => (i === keyLine ? l.replace(/\s{6,}\d{1,2}\s*$/, "") : l));
      const title = lines2[0].trim().replace(/\.$/, "");
      current = {
        id: `callout-${m[2]}`,
        kind: "callout",
        key: m[2],
        title,
        page,
        panel,
        body: dedent(lines2),
      };
      out.push(current);
    } else if (current) {
      current.body += `\n${dedent(para)}`;
    }
  }
  return out;
}

export function parseSections(panels: PanelText[]): Section[] {
  const sections: Section[] = [];
  for (const { page, panel, text } of panels) {
    const lines = text.split("\n");
    let current: { head: Omit<Section, "body">; body: string[] } | null = null;
    const pre: string[] = [];
    const flush = (): void => {
      if (!current) return;
      const body = dedent(current.body);
      if (body) sections.push({ ...current.head, body });
      current = null;
    };
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      const prevBlank = i === 0 || !lines[i - 1].trim();
      const loc = t.match(LOCATION);
      if (loc) {
        flush();
        const title = loc[2].trim();
        current = {
          head: { id: loc[1], kind: "location", key: loc[1], title, page, panel },
          body: [],
        };
        continue;
      }
      if (isCaps(t) && (prevBlank || /^!|!$/.test(t))) {
        flush();
        let title = stripMarks(t);
        while (
          i + 1 < lines.length &&
          isCaps(lines[i + 1].trim()) &&
          !LOCATION.test(lines[i + 1].trim())
        ) {
          title += ` ${stripMarks(lines[++i].trim())}`;
        }
        current = { head: { id: slug(title), kind: "section", title, page, panel }, body: [] };
        continue;
      }
      if (current) (current as { body: string[] }).body.push(lines[i]);
      else pre.push(lines[i]);
    }
    flush();
    sections.push(...callouts(pre, page, panel));
  }
  return sections;
}

export interface Item {
  n: number;
  text: string;
}

export function parseItems(body: string): Item[] {
  const items: Item[] = [];
  for (const line of body.split("\n")) {
    const m = line.trim().match(/^(\d{1,2})\.\s*(.*)$/);
    if (m) items.push({ n: parseInt(m[1], 10), text: m[2] });
    else if (items.length && line.trim()) items.at(-1)!.text += ` ${line.trim()}`;
  }
  return items;
}

export interface Stats {
  combat: number;
  instinct: number;
  wounds: number;
  health?: number;
}

export function parseStats(text: string): Stats | null {
  const full = text.match(
    /COMBAT:?\s*(\d+).*?INSTINCT:?\s*(\d+).*?WOUNDS:?\s*(\d+)(?:\s*\((\d+)\))?/is,
  );
  const inline = text.match(/\bC:\s*(\d+)\b.*?\bI:\s*(\d+)\s+W:\s*(\d+)(?:\s*\((\d+)\))?/s);
  const m = full ?? inline;
  if (!m) return null;
  const stats: Stats = {
    combat: parseInt(m[1], 10),
    instinct: parseInt(m[2], 10),
    wounds: parseInt(m[3], 10),
  };
  if (m[4]) stats.health = parseInt(m[4], 10);
  return stats;
}
