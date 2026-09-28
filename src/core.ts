import { corePdf } from "./pdf/config.ts";
import { extractPages } from "./pdf/extract.ts";
import type { Entry } from "./parse/dtable.ts";
import { parseDieTable } from "./parse/dtable.ts";

const PANIC_HEADER = /D20\s+PANIC EFFECT/;

export function panicTable(): Entry[] {
  try {
    const page = extractPages(corePdf("survival")).find((p) => PANIC_HEADER.test(p));
    return page ? parseDieTable(page, PANIC_HEADER) : [];
  } catch {
    return [];
  }
}
