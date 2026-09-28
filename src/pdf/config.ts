import { existsSync, readdirSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";
import { isFirstParty } from "./meta.ts";

const REPO_ROOT = join(import.meta.dir, "..", "..");

export type CoreBook = "survival" | "warden";

const ENV_VAR: Record<CoreBook, string> = {
  survival: "MOSHI_SURVIVAL_PDF",
  warden: "MOSHI_WARDEN_PDF",
};

const HINT: Record<CoreBook, { word: string; re: RegExp }> = {
  survival: { word: "survival", re: /survival/i },
  warden: { word: "operations", re: /operations/i },
};

export function bookDirs(): string[] {
  return [
    process.env.MOSHI_BOOKS,
    "books",
    join(REPO_ROOT, "books"),
    join(homedir(), ".config", "moshi", "books"),
  ].filter((d): d is string => Boolean(d));
}

export function listPdfs(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const dir of bookDirs()) {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    for (const rel of readdirSync(dir, { recursive: true }) as string[]) {
      if (!rel.toLowerCase().endsWith(".pdf") || basename(rel).startsWith("._")) continue;
      const path = join(dir, rel);
      const real = realpathSync(path);
      if (seen.has(real)) continue;
      seen.add(real);
      out.push(path);
    }
  }
  return out.toSorted();
}

function coreBookOf(path: string): CoreBook | null {
  const name = basename(path);
  for (const book of Object.keys(HINT) as CoreBook[]) {
    if (HINT[book].re.test(name)) return book;
  }
  return null;
}

export function corePdf(book: CoreBook): string {
  const fromEnv = process.env[ENV_VAR[book]];
  if (fromEnv && existsSync(fromEnv)) return fromEnv;
  const match = listPdfs().find((p) => coreBookOf(p) === book);
  if (match) return match;
  throw new Error(
    `No PDF found for the ${book} book. Either:\n` +
      `  • drop your legally-owned PDF (filename containing "${HINT[book].word}") into ./books/ or ~/.config/moshi/books/, or\n` +
      `  • set ${ENV_VAR[book]} to its path.\n` +
      `No Mothership content is bundled; you must supply your own books.`,
  );
}

export interface ModuleRef {
  id: string;
  slug: string;
  version?: string;
  name: string;
  path: string;
  firstParty?: boolean;
}

// "Mothership-Foo-v1.3-for-backers.pdf" -> id "foo@1.3"
export function moduleRef(path: string): ModuleRef {
  let stem = basename(path).replace(/\.pdf$/i, "");
  let version: string | undefined;
  const v = stem.match(/[-_ ]v(\d+(?:\.\d+)*[a-z]*)(?:[-_ ].*)?$/i);
  if (v) {
    version = v[1].toLowerCase();
    stem = stem.slice(0, v.index);
  }
  stem = stem.replace(/^mothership[-_ ]+/i, "");
  const slug = stem
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const name = stem.replace(/[-_]+/g, " ").trim();
  return { id: version ? `${slug}@${version}` : slug, slug, version, name, path };
}

export function listModules(opts: { all?: boolean } = {}): ModuleRef[] {
  const mods = listPdfs()
    .filter((p) => coreBookOf(p) === null)
    .map((p) => Object.assign(moduleRef(p), { firstParty: isFirstParty(p) }));
  return opts.all ? mods : mods.filter((m) => m.firstParty);
}

function compareVersions(a = "", b = ""): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// Exact id, then exact slug (newest version), then a unique substring.
export function matchModule(query: string, modules: ModuleRef[]): ModuleRef {
  const q = query.toLowerCase();
  const exact = modules.find((m) => m.id === q);
  if (exact) return exact;
  const bySlug = modules.filter((m) => m.slug === q);
  if (bySlug.length > 0) {
    return bySlug.toSorted((a, b) => compareVersions(b.version, a.version))[0];
  }
  const hits = modules.filter((m) => m.id.includes(q));
  if (hits.length === 1) return hits[0];
  if (hits.length === 0) throw new Error(`No module matches "${query}". Try: moshi books`);
  throw new Error(
    `"${query}" matches several modules:\n${hits.map((m) => `  ${m.id}`).join("\n")}`,
  );
}
