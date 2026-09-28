import { loadState } from "../state.ts";
import { emit } from "../out.ts";
import type { CoreBook } from "../pdf/config.ts";
import { corePdf } from "../pdf/config.ts";
import { extractPages, extractPanels } from "../pdf/extract.ts";

const USAGE = "Usage: moshi search <text> [--in=module|survival|warden] [--limit=N]";

interface Hit {
  book: string;
  page: number;
  line: string;
  context: string[];
}

function scan(book: string, pages: { page: number; text: string }[], q: RegExp): Hit[] {
  const hits: Hit[] = [];
  for (const { page, text } of pages) {
    const lines = text.split("\n");
    lines.forEach((l, i) => {
      if (!q.test(l)) return;
      const context = lines
        .slice(Math.max(0, i - 1), i + 2)
        .map((c) => c.trim())
        .filter(Boolean);
      hits.push({ book, page, line: l.trim(), context });
    });
  }
  return hits;
}

export function cmdSearch(args: string[]): void {
  const query = args.filter((a) => !a.startsWith("-")).join(" ");
  if (!query) throw new Error(USAGE);
  const inArg = args.find((a) => a.startsWith("--in="))?.slice(5);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.slice(8), 10) : 20;
  const q = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "i");

  const hits: Hit[] = [];
  const mod = loadState().module;
  if (mod && (!inArg || inArg === "module")) {
    hits.push(...scan(mod.id, extractPanels(mod.path), q));
  }
  for (const book of ["survival", "warden"] as CoreBook[]) {
    if (inArg && inArg !== book) continue;
    try {
      const pages = extractPages(corePdf(book)).map((text, i) => ({ page: i + 1, text }));
      hits.push(...scan(book, pages, q));
    } catch {
      // missing book: search the rest
    }
  }
  const shown = hits.slice(0, limit);
  const text = shown.length
    ? shown.map((h) => `${h.book} p${h.page}\n  ${h.context.join("\n  ")}`).join("\n\n") +
      (hits.length > limit ? `\n\n(${hits.length - limit} more; --limit=N)` : "")
    : `No matches for "${query}".`;
  emit(args, { query, total: hits.length, hits: shown }, text);
}

export function cmdPage(args: string[]): void {
  const [book, n] = args.filter((a) => !a.startsWith("-"));
  const page = parseInt(n ?? "", 10);
  if (!book || Number.isNaN(page)) {
    throw new Error("Usage: moshi page <survival|warden|module> <n>");
  }
  let text: string | undefined;
  if (book === "module") {
    const mod = loadState().module;
    if (!mod) throw new Error("No active module. Run: moshi use <module>");
    const panels = extractPanels(mod.path).filter((p) => p.page === page);
    text = panels.length ? panels.map((p) => p.text.trimEnd()).join("\n\n") : undefined;
  } else if (book === "survival" || book === "warden") {
    text = extractPages(corePdf(book))[page - 1];
  } else {
    throw new Error("Usage: moshi page <survival|warden|module> <n>");
  }
  if (text === undefined) throw new Error(`No page ${page} in ${book}.`);
  emit(args, { book, page, text }, text.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n"));
}
