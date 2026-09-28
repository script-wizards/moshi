import { activeModule, findSection, logEvent, moduleSections } from "../active.ts";
import { rollDie } from "../dice.ts";
import { emit } from "../out.ts";
import { parseItems } from "../parse/sections.ts";

const USAGE = "Usage: moshi table <section> [dN]   (rolls on a numbered list in that section)";

export function cmdTable(args: string[]): void {
  const pos = args.filter((a) => !a.startsWith("-"));
  const dieArg = pos.find((a) => /^d\d+$/i.test(a));
  const query = pos.filter((a) => a !== dieArg).join(" ");
  if (!query) throw new Error(USAGE);

  const { section } = findSection(moduleSections(activeModule().path), query);
  const items = parseItems(section.body);
  if (items.length === 0) throw new Error(`${section.title} has no numbered list to roll on.`);
  const sides = dieArg ? parseInt(dieArg.slice(1), 10) : items.length;
  const roll = rollDie(sides);
  const item = items.find((i) => i.n === roll) ?? null;

  const text = item
    ? `d${sides} → ${roll}: ${item.text}`
    : `d${sides} → ${roll}: no entry ${roll} in ${section.title}`;
  logEvent("table", `${section.title} ${text}`);
  emit(args, { section: section.id, sides, roll, item }, text);
}
