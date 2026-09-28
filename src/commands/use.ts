import { existsSync } from "node:fs";
import { emit } from "../out.ts";
import type { ModuleRef } from "../pdf/config.ts";
import { listModules, matchModule, moduleRef } from "../pdf/config.ts";
import { loadState, saveState } from "../state.ts";

function pickModule(query: string): ModuleRef {
  try {
    return matchModule(query, listModules());
  } catch {
    return matchModule(query, listModules({ all: true }));
  }
}

export function cmdUse(args: string[]): void {
  const query = args.find((a) => !a.startsWith("-"));
  const state = loadState();

  if (!query) {
    const m = state.module ?? null;
    emit(args, { module: m }, m ? `${m.id}  ${m.path}` : "No active module. moshi use <module>");
    return;
  }

  const m =
    query.toLowerCase().endsWith(".pdf") && existsSync(query)
      ? moduleRef(query)
      : pickModule(query);
  state.module = { id: m.id, path: m.path };
  saveState(state);
  emit(args, { module: state.module }, `Now running ${m.name} (${m.id})`);
}
