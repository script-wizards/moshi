import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface State {
  module?: { id: string; path: string };
}

export function stateFile(): string {
  if (process.env.MOSHI_STATE) return process.env.MOSHI_STATE;
  const base = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  return join(base, "moshi", "moshi-state.json");
}

export function loadState(): State {
  const file = stateFile();
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, "utf8")) as State;
}

export function saveState(state: State): void {
  const file = stateFile();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
}
