import { existsSync } from "node:fs";
import { emit } from "../out.ts";
import { listModules, matchModule, moduleRef } from "../pdf/config.ts";
import { loadState, saveState } from "../state.ts";

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
      : matchModule(query, listModules());
  state.module = { id: m.id, path: m.path };
  saveState(state);
  emit(args, { module: state.module }, `Now running ${m.name} (${m.id})`);
}
