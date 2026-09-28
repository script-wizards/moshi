// Flags repo text that matches any 8-word run in your books. See CONTRIBUTING.md.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { listPdfs } from "../src/pdf/config.ts";
import { extractPages } from "../src/pdf/extract.ts";

const args = process.argv.slice(2);
const staged = args.includes("--staged");
const nArg = args.find((a) => a.startsWith("--n="));
const N = nArg ? parseInt(nArg.slice(4), 10) : 8;

const SKIP_EXT = new Set([".lock", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2"]);
const SKIP_FILE = new Set(["LICENSE", "bun.lock"]);

function git(argv: string[]): string {
  const out = spawnSync("git", argv, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (out.status !== 0) throw new Error(`git ${argv.join(" ")} failed: ${out.stderr}`);
  return out.stdout;
}

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

const pdfs = listPdfs();
if (pdfs.length === 0) {
  console.warn("audit: no books found (see README); skipped. Run it with books before publishing.");
  process.exit(0);
}

const shingles = new Map<string, number>();
for (const [i, pdf] of pdfs.entries()) {
  let pages: string[];
  try {
    pages = extractPages(pdf);
  } catch (e) {
    console.warn(`audit: skipping ${basename(pdf)}: ${(e as Error).message}`);
    continue;
  }
  const t = tokens(pages.join("\n"));
  for (let j = 0; j + N <= t.length; j++) {
    const key = t.slice(j, j + N).join(" ");
    if (!shingles.has(key)) shingles.set(key, i);
  }
}

const files = (
  staged
    ? git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"])
    : git(["ls-files", "--cached", "--others", "--exclude-standard"])
)
  .split("\n")
  .filter((f) => f && !SKIP_FILE.has(basename(f)) && !SKIP_EXT.has(extname(f).toLowerCase()));

let hits = 0;
for (const file of files) {
  const text = staged ? git(["show", `:${file}`]) : readFileSync(file, "utf8");
  const toks: string[] = [];
  const lines: number[] = [];
  for (const [ln, line] of text.split("\n").entries()) {
    for (const t of tokens(line)) {
      toks.push(t);
      lines.push(ln + 1);
    }
  }
  let lastReported = -N;
  for (let j = 0; j + N <= toks.length; j++) {
    const key = toks.slice(j, j + N).join(" ");
    const book = shingles.get(key);
    if (book === undefined || j < lastReported + N) continue;
    lastReported = j;
    hits++;
    console.log(`${file}:${lines[j]}  "${key}"  (${basename(pdfs[book])})`);
  }
}

if (hits > 0) {
  console.error(`\naudit: ${hits} phrase(s) match your books. Rewrite them in your own words.`);
  process.exit(1);
}
console.log(`audit: ${files.length} file(s) clean against ${pdfs.length} book(s).`);
