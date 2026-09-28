import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CACHE_DIR = join(homedir(), ".cache", "moshi");

function run(bin: string, args: string[]): string {
  const out = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (out.error) throw new Error(`Could not run ${bin} (install poppler?): ${out.error.message}`);
  if (out.status !== 0) throw new Error(`${bin} failed: ${out.stderr}`);
  return out.stdout;
}

function cached<T>(pdfPath: string, kind: string, make: () => T): T {
  const st = statSync(pdfPath);
  const key = hashKey(`${kind}:${pdfPath}:${st.size}:${st.mtimeMs}`);
  const cacheFile = join(CACHE_DIR, `${kind === "pages" ? "" : `${kind}-`}${key}.json`);
  if (existsSync(cacheFile)) return JSON.parse(readFileSync(cacheFile, "utf8")) as T;
  const value = make();
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(cacheFile, JSON.stringify(value));
  return value;
}

export function extractPages(pdfPath: string): string[] {
  return cached(pdfPath, "pages", () => run("pdftotext", ["-layout", pdfPath, "-"]).split("\f"));
}

export interface PdfInfo {
  author: string;
  pages: { width: number; height: number }[];
}

export function pdfInfo(pdfPath: string): PdfInfo {
  return cached(pdfPath, "info", () => {
    const out = run("pdfinfo", ["-f", "1", "-l", "9999", pdfPath]);
    const author = out.match(/^Author:\s*(.*)$/m)?.[1]?.trim() ?? "";
    const pages = [...out.matchAll(/^Page\s+\d+ size:\s*([\d.]+) x ([\d.]+)/gm)].map((m) => ({
      width: parseFloat(m[1]),
      height: parseFloat(m[2]),
    }));
    return { author, pages };
  });
}

export interface Panel {
  page: number;
  panel: number;
  text: string;
}

// Landscape pages are read as trifold panels, cropped one at a time so the
// columns don't interleave.
export function extractPanels(pdfPath: string): Panel[] {
  return cached(pdfPath, "panels", () => {
    const panels: Panel[] = [];
    for (const [i, { width, height }] of pdfInfo(pdfPath).pages.entries()) {
      const page = i + 1;
      const count = width > height ? 3 : 1;
      const w = width / count;
      for (let p = 0; p < count; p++) {
        const text = run("pdftotext", [
          "-layout",
          "-f",
          String(page),
          "-l",
          String(page),
          "-x",
          String(Math.round(p * w)),
          "-y",
          "0",
          "-W",
          String(Math.round(w)),
          "-H",
          String(Math.round(height)),
          pdfPath,
          "-",
        ]);
        panels.push({ page, panel: p + 1, text: text.replace(/\f/g, "") });
      }
    }
    return panels;
  });
}

function hashKey(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
