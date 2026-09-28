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
  const core = Object.fromEntries(CORE.map((b) => [b, tryCore(b)]));
  const modules = listModules();
  const active = loadState().module?.id ?? null;

  const lines = ["Core books"];
  for (const b of CORE) lines.push(`  ${b.padEnd(10)} ${core[b] ?? "(not found)"}`);
  lines.push("", `Modules (${modules.length})`);
  for (const m of modules) lines.push(`${m.id === active ? "* " : "  "}${m.id}`);
  if (modules.length === 0) {
    lines.push(`  none found; searched: ${bookDirs().join(", ")}`);
  }
  emit(args, { core, modules, active, searched: bookDirs() }, lines.join("\n"));
}
