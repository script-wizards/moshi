export interface Entry {
  n: number;
  name: string;
  text: string;
}

// A die table whose roll numbers sit beside multi-line entries. Entries are
// found by their all-caps name ("SOMETHING. effect...") and numbered in order.
export function parseDieTable(page: string, header: RegExp): Entry[] {
  const lines = page.split("\n");
  const h = lines.findIndex((l) => header.test(l));
  if (h < 0) return [];
  const col = lines[h].search(/\bD\d+\b/);
  if (col < 0) return [];
  const entries: Entry[] = [];
  for (const line of lines.slice(h + 1)) {
    const seg = line
      .slice(col)
      .replace(/^\s*\d{1,2}(?=\s|$)/, "")
      .trim();
    if (!seg) continue;
    const name = seg.match(/^([A-Z][A-Z'’ ()/-]{2,})\.\s*/);
    if (name) {
      entries.push({ n: entries.length + 1, name: name[1].trim(), text: seg });
    } else if (entries.length) {
      entries.at(-1)!.text += ` ${seg}`;
    }
  }
  return entries;
}
