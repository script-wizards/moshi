import { spawn } from "node:child_process";
import { readdirSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";
import { activeModule, logEvent } from "../active.ts";
import { emit } from "../out.ts";
import { slug } from "../parse/sections.ts";

const AUDIO = new Set([".mp3", ".m4a", ".wav", ".ogg", ".aiff"]);

function audioFiles(modulePath: string): string[] {
  const dir = dirname(modulePath);
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter((f) => AUDIO.has(extname(f).toLowerCase()) && !basename(f).startsWith("._"))
    .map((f) => join(dir, f))
    .toSorted();
}

export function cmdAudio(args: string[]): void {
  const query = args.filter((a) => !a.startsWith("-")).join(" ");
  const files = audioFiles(activeModule().path);
  if (!query) {
    const text = files.length
      ? `${files.map((f) => `  ${basename(f)}`).join("\n")}\n\nmoshi audio <words from a filename>`
      : "No audio files next to this module's PDF.";
    emit(args, { files }, text);
    return;
  }
  const words = slug(query).split("-");
  const hits = files.filter((f) => words.every((w) => slug(basename(f)).includes(w)));
  if (hits.length !== 1) {
    const list = (hits.length ? hits : files).map((f) => `  ${basename(f)}`).join("\n");
    throw new Error(`${hits.length ? "Several" : "No"} audio files match "${query}":\n${list}`);
  }
  const file = hits[0];
  if (!args.includes("--no-play")) {
    const player = process.platform === "darwin" ? "afplay" : "mpv";
    spawn(player, [file], { detached: true, stdio: "ignore" }).unref();
  }
  logEvent("audio", basename(file));
  const playing = !args.includes("--no-play");
  emit(args, { file, playing }, `${playing ? "Playing" : "Found"} ${basename(file)}`);
}
