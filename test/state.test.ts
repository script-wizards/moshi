import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadState, saveState, stateFile } from "../src/state.ts";

const dir = mkdtempSync(join(tmpdir(), "moshi-state-"));
process.env.MOSHI_STATE = join(dir, "nested", "state.json");
afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("missing state reads as empty", () => {
  expect(loadState()).toEqual({});
});

test("state round-trips and creates its folder", () => {
  saveState({ module: { id: "ember-relay", path: "/tmp/Ember_Relay.pdf" } });
  expect(stateFile()).toBe(process.env.MOSHI_STATE!);
  expect(loadState().module?.id).toBe("ember-relay");
});
