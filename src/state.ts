import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface State {
  module?: { id: string; path: string };
}

export interface Clock {
  name: string;
  mode: "real" | "game";
  due: number;
  every?: number;
}

export type Fields = Record<string, string | number>;

export interface Session {
  started: string;
  location?: string;
  gameMinutes: number;
  pausedAt?: number;
  clocks: Clock[];
  cast: Record<string, Fields>;
  flags: Record<string, string>;
}

export interface LogEntry {
  at: string;
  game: number;
  kind: string;
  text: string;
}

export function stateDir(): string {
  if (process.env.MOSHI_STATE_DIR) return process.env.MOSHI_STATE_DIR;
  const base = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  return join(base, "moshi");
}

function readJson<T>(file: string, fallback: T): T {
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as T) : fallback;
}

function writeJson(file: string, value: unknown): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function loadState(): State {
  return readJson(join(stateDir(), "moshi-state.json"), {});
}

export function saveState(state: State): void {
  writeJson(join(stateDir(), "moshi-state.json"), state);
}

function sessionBase(moduleId: string): string {
  return join(stateDir(), "sessions", moduleId.replace(/[^a-z0-9@.-]/gi, "_"));
}

export function newSession(): Session {
  return {
    started: new Date().toISOString(),
    gameMinutes: 0,
    clocks: [],
    cast: {},
    flags: {},
  };
}

export function loadSession(moduleId: string): Session {
  return readJson(`${sessionBase(moduleId)}.json`, newSession());
}

export function saveSession(moduleId: string, session: Session): void {
  writeJson(`${sessionBase(moduleId)}.json`, session);
}

export function archiveSession(moduleId: string): string | null {
  const base = sessionBase(moduleId);
  if (!existsSync(`${base}.json`)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  renameSync(`${base}.json`, `${base}.${stamp}.json`);
  if (existsSync(`${base}.log.jsonl`))
    renameSync(`${base}.log.jsonl`, `${base}.${stamp}.log.jsonl`);
  return `${base}.${stamp}.json`;
}

export function appendLog(moduleId: string, entry: LogEntry): void {
  const file = `${sessionBase(moduleId)}.log.jsonl`;
  mkdirSync(dirname(file), { recursive: true });
  appendFileSync(file, `${JSON.stringify(entry)}\n`);
}

export function readLog(moduleId: string): LogEntry[] {
  const file = `${sessionBase(moduleId)}.log.jsonl`;
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as LogEntry);
}
