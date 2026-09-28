import { emit } from "../out.ts";
import type { CoreBook } from "../pdf/config.ts";
import { bookDirs, corePdf, listModules } from "../pdf/config.ts";
import { loadState } from "../state.ts";

const CORE: CoreBook[] = ["survival", "warden"];

function tryCore(book: CoreBook): string | null {
  try {
    return corePdf(book);
  } catch {
    return null;
  }
}

export function cmdBooks(args: string[]): void {
  const all = args.includes("--all");
  const core = Object.fromEntries(CORE.map((b) => [b, tryCore(b)]));
  const modules = listModules({ all });
  const active = loadState().module?.id ?? null;

  const lines = ["Core books"];
  for (const b of CORE) lines.push(`  ${b.padEnd(10)} ${core[b] ?? "(not found)"}`);
  lines.push("", `${all ? "All modules" : "First-party modules"} (${modules.length})`);
  for (const m of modules) {
    const mark = m.id === active ? "* " : "  ";
    lines.push(`${mark}${m.id}${all && !m.firstParty ? "" : all ? "   (first-party)" : ""}`);
  }
  if (modules.length === 0) lines.push(`  none found; searched: ${bookDirs().join(", ")}`);
  if (!all) lines.push("", "moshi books --all  to include third-party PDFs");
  emit(args, { core, modules, active, searched: bookDirs() }, lines.join("\n"));
}
